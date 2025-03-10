import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Debug logging function
async function logToDebugEndpoint(data: any, type: string) {
  try {
    const debugPayload = {
      source: "etegram-webhook",
      type: type,
      timestamp: new Date().toISOString(),
      data: data,
    };

    const response = await fetch("https://seller.rest/debug/debug.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(debugPayload),
    });

    if (!response.ok) {
      console.error("Debug logging failed", await response.text());
    }
  } catch (error) {
    console.error("Error in debug logging:", error);
  }
}

// Singleton PrismaClient instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Etegram webhook response type
interface EtegramWebhookPayload {
  virtualAccount: {
    _id: string;
    client: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    currencyCode: string;
    validFor: string;
    externalReference: string;
    amountControl: string;
    amount: number;
    expiryDate: string;
    callbackUrl: string;
    status: string;
  };
  projectID: string;
  amount: number;
  fees: number;
  status: string;
  type: string;
  reference: string;
  environment: string;
  phone: string;
  email: string;
  fullname: string;
  accessCode: string;
  isReversed: boolean;
  createdAt: string;
  updatedAt: string;
  channel: string;
  sessionId: string;
  id: string;
}

export async function POST(request: Request) {
  let rawBody: string = "";
  let payload: EtegramWebhookPayload | null = null;

  try {
    // Log incoming request
    await logToDebugEndpoint({ method: "POST" }, "request_received");

    // Read raw body
    rawBody = await request.text();
    await logToDebugEndpoint({ rawBody }, "raw_body");

    if (!rawBody) {
      await logToDebugEndpoint({ message: "Empty request body" }, "error");
      return NextResponse.json(
        { success: false, message: "Empty request body" },
        { status: 400 }
      );
    }

    // Parse payload
    try {
      payload = JSON.parse(rawBody);
      await logToDebugEndpoint({ payload }, "payload_parsed");
    } catch (parseError) {
      const errorMessage =
        parseError instanceof Error ? parseError.message : String(parseError);
      await logToDebugEndpoint(
        {
          message: "Invalid JSON payload",
          error: errorMessage,
          rawBody: rawBody.substring(0, 500),
        },
        "parse_error"
      );

      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON payload",
          error: errorMessage,
          rawBody: rawBody.substring(0, 500),
        },
        { status: 400 }
      );
    }

    // Typescript non-null assertion for payload after parsing
    const safePayload = payload!;

    // Validate payload structure
    if (!safePayload.reference || !safePayload.amount || !safePayload.status) {
      await logToDebugEndpoint(
        {
          message: "Missing required payload fields",
          missingFields: {
            reference: !safePayload.reference,
            amount: !safePayload.amount,
            status: !safePayload.status,
          },
        },
        "validation_error"
      );

      return NextResponse.json(
        {
          success: false,
          message: "Missing required payload fields",
          missingFields: {
            reference: !safePayload.reference,
            amount: !safePayload.amount,
            status: !safePayload.status,
          },
        },
        { status: 400 }
      );
    }

    const { reference, amount, status, email, phone, fullname } = safePayload;

    // Find the pending payment
    const pendingPayment = await prisma.pendingPayment.findUnique({
      where: { reference },
      include: { enrollment: true },
    });

    if (!pendingPayment) {
      await logToDebugEndpoint(
        {
          message: "No pending payment found",
          reference: reference,
        },
        "pending_payment_not_found"
      );

      return NextResponse.json(
        { success: false, message: "Pending payment not found" },
        { status: 404 }
      );
    }

    // Calculate commission (10% of amount, capped at 10,000)
    const commission = Math.min(amount * 0.1, 10000);

    // Map Etegram status to our system
    const paymentStatus =
      status === "successful"
        ? "completed"
        : status === "failed"
        ? "failed"
        : "pending";
    const transactionStatus =
      paymentStatus === "completed"
        ? "Success"
        : paymentStatus === "failed"
        ? "Failed"
        : "Pending";

    // Process within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check for duplicate payment
      const existingPayment = await tx.payment.findUnique({
        where: { reference },
      });
      if (existingPayment) {
        await logToDebugEndpoint(
          {
            message: "Payment already processed",
            reference: reference,
          },
          "duplicate_payment"
        );

        return { payment: existingPayment, transaction: null };
      }

      // Create Payment record
      const payment = await tx.payment.create({
        data: {
          userId: pendingPayment.userId,
          enrollmentId: pendingPayment.enrollmentId,
          amount: amount,
          reference: reference,
          provider: "etegram",
          status: paymentStatus,
          planCode: pendingPayment.planCode, // Kept as metadata
          createdAt: new Date(safePayload.updatedAt),
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

      // Safely split fullname
      const nameParts = fullname.trim().split(/\s+/);
      const firstName = nameParts[0] || pendingPayment.enrollment.firstName;
      const lastName =
        nameParts.slice(1).join(" ") ||
        pendingPayment.enrollment.lastName ||
        "";

      // Update Enrollment
      await tx.enrollment.update({
        where: { id: pendingPayment.enrollmentId },
        data: {
          paymentStatus: paymentStatus === "completed" ? "paid" : "pending",
          lastPaymentDate: new Date(safePayload.updatedAt),
          reference: reference,
          amount: amount,
          status:
            paymentStatus === "completed"
              ? "active"
              : pendingPayment.enrollment.status,
          // phone: phone || pendingPayment.enrollment.phone,
          // email: email || pendingPayment.email,
          // firstName: firstName,
          // lastName: lastName,
        },
      });

      // Create Transaction record (no planId)
      const transaction = await tx.transaction.create({
        data: {
          amount: amount,
          status: transactionStatus,
          type: "OneTime",
          commission: commission,
          userId: pendingPayment.userId,
          enrollmentId: pendingPayment.enrollmentId,
          planId: pendingPayment.planCode, // Optional: stored as metadata
        },
      });

      // Log successful transaction
      await logToDebugEndpoint(
        {
          message: "Transaction processed successfully",
          paymentId: payment.id,
          transactionId: transaction.id,
        },
        "transaction_success"
      );

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
    // Log the error
    await logToDebugEndpoint(
      {
        message: "Webhook processing error",
        error: error instanceof Error ? error.message : String(error),
        rawBody: rawBody
          ? rawBody.substring(0, 200) + "..."
          : "No body received",
      },
      "processing_error"
    );

    // Attempt to update pending payment if reference is available
    if (payload && payload.reference) {
      try {
        await prisma.pendingPayment.update({
          where: { reference: payload.reference },
          data: { status: "failed" },
        });
      } catch (updateError) {
        await logToDebugEndpoint(
          {
            message: "Failed to update pending payment",
            error:
              updateError instanceof Error
                ? updateError.message
                : String(updateError),
          },
          "update_error"
        );
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
