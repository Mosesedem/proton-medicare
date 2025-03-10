// /api/webhook/paystack/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
// import crypto from "crypto";

// Singleton PrismaClient instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Paystack webhook response type
interface PaystackWebhookPayload {
  event: "charge.success" | "charge.failed" | string;
  data: {
    id: number;
    domain: string;
    status: "success" | "failed" | string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    fees_breakdown: any | null;
    log: any | null;
    fees: number;
    fees_split: any | null;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: any | null;
      risk_action: string;
      international_format_phone: string | null;
    };
    plan: any;
    subaccount: any;
    split: any;
    order_id: string | null;
    paidAt: string;
    requested_amount: number;
    pos_transaction_data: any | null;
    source: {
      type: string;
      source: string;
      entry_point: string;
      identifier: string | null;
    };
  };
}

// Verify Paystack signature
// function verifySignature(
//   body: string,
//   signature: string | null,
//   secret: string
// ): boolean {
//   if (!signature) return false;
//   const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
//   return hash === signature;
// }

export async function POST(request: Request) {
  let rawBody: string = "";
  let payload: PaystackWebhookPayload | undefined;

  try {
    // Read raw body
    rawBody = await request.text();
    console.log("Raw webhook body:", rawBody);

    if (!rawBody) {
      return NextResponse.json(
        { success: false, message: "Empty request body" },
        { status: 400 }
      );
    }

    // Parse payload
    try {
      payload = JSON.parse(rawBody);
      console.log(
        "Received webhook payload:",
        JSON.stringify(payload, null, 2)
      );
    } catch (parseError) {
      console.error("Failed to parse webhook payload:", parseError);
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Verify Paystack signature
    // const signature = request.headers.get("x-paystack-signature");
    // const secret = process.env.PAYSTACK_SECRET_KEY;
    // if (!secret) {
    //   console.error("PAYSTACK_SECRET_KEY not configured");
    //   return NextResponse.json(
    //     { success: false, message: "Server configuration error" },
    //     { status: 500 }
    //   );
    // }

    // const isValid = verifySignature(rawBody, signature, secret);
    // if (!isValid) {
    //   console.error("Invalid Paystack signature");
    //   return NextResponse.json(
    //     { success: false, message: "Invalid signature" },
    //     { status: 401 }
    //   );
    // }

    // Check payload structure
    if (!payload || !payload.event || !payload.data) {
      return NextResponse.json(
        { success: false, message: "Invalid payload structure" },
        { status: 400 }
      );
    }

    // Only process charge.success events
    if (payload.event !== "charge.success") {
      return NextResponse.json(
        { success: true, message: `Event ${payload.event} not processed` },
        { status: 200 }
      );
    }

    const { data } = payload;
    const { reference, amount, status, customer, paidAt } = data;
    const parsedAmount = amount / 100; // Convert from kobo to NGN

    // Find the pending payment
    const pendingPayment = await prisma.pendingPayment.findUnique({
      where: { reference },
      include: { enrollment: true },
    });

    if (!pendingPayment) {
      console.log(`No pending payment found for reference: ${reference}`);
      return NextResponse.json(
        { success: false, message: "Pending payment not found" },
        { status: 404 }
      );
    }

    // Map status
    const paymentStatus = status === "success" ? "completed" : "failed";
    const transactionStatus =
      paymentStatus === "completed" ? "Success" : "Failed";

    // Calculate commission (10% of amount, capped at 10,000)
    const commission = Math.min(parsedAmount * 0.1, 10000);

    // Handle metadata
    let metadata = {};
    try {
      if (typeof data.metadata === "string") {
        metadata = JSON.parse(data.metadata);
      } else if (data.metadata && typeof data.metadata === "object") {
        metadata = data.metadata;
      }
    } catch (metadataError) {
      console.error("Error parsing metadata:", metadataError);
    }

    // Process within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check for duplicate payment
      const existingPayment = await tx.payment.findUnique({
        where: { reference },
      });
      if (existingPayment) {
        console.log(`Payment already processed for reference: ${reference}`);
        return { payment: existingPayment, transaction: null }; // Early return if already processed
      }

      // Create Payment record
      const payment = await tx.payment.create({
        data: {
          userId: pendingPayment.userId,
          enrollmentId: pendingPayment.enrollmentId,
          amount: parsedAmount,
          reference: reference,
          provider: "paystack",
          // type: (metadata as any).is_subscription ? "subscription" : "onetime",
          status: paymentStatus,
          planCode:
            pendingPayment.planCode || (metadata as any).plan_code || "",
          createdAt: new Date(paidAt),
        },
      });

      // Update PendingPayment
      await tx.pendingPayment.update({
        where: { id: pendingPayment.id },
        data: {
          paymentid: payment.id,
          status: paymentStatus,
        },
      });

      // Update Enrollment
      await tx.enrollment.update({
        where: { id: pendingPayment.enrollmentId },
        data: {
          paymentStatus: paymentStatus === "completed" ? "paid" : "pending",
          lastPaymentDate: new Date(paidAt),
          reference: reference,
          amount: parsedAmount,
          status:
            paymentStatus === "completed"
              ? "active"
              : pendingPayment.enrollment.status,
          //   email: customer.email || pendingPayment.email,
          //   firstName: customer.first_name || (metadata as any).first_name || "",
          //   lastName: customer.last_name || (metadata as any).last_name || "",
        },
      });

      // Create Transaction record
      const transaction = await tx.transaction.create({
        data: {
          amount: parsedAmount,
          status: transactionStatus,
          type: (metadata as any).is_subscription ? "Renewal" : "OneTime",
          commission: commission,
          userId: pendingPayment.userId,
          planId: pendingPayment.planCode,
          enrollmentId: pendingPayment.enrollmentId,
        },
      });

      return { payment, transaction };
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and processed",
      data: {
        paymentId: result.payment.id,
        transactionId: result.transaction?.id || null,
        status: paymentStatus,
        reference: reference,
      },
    });
  } catch (error) {
    console.error("Paystack webhook processing error:", error);

    // Attempt to update pending payment if reference is available
    if (payload?.data?.reference) {
      try {
        await prisma.pendingPayment.update({
          where: { reference: payload.data.reference },
          data: { status: "failed" },
        });
      } catch (updateError) {
        console.error("Failed to update pending payment:", updateError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Webhook processing error",
        error: error instanceof Error ? error.message : String(error),
        rawBody: rawBody
          ? rawBody.substring(0, 200) + "..."
          : "No body received",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
