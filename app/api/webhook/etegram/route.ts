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
  metadata?: any; // Added for consistency with Paystack
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
      throw new Error("Empty request body");
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
        "parse_error",
      );
      throw new Error("Invalid JSON payload");
    }

    // Typescript non-null assertion for payload after parsing
    const safePayload = payload!;

    // Skip non-success events
    if (safePayload.status !== "successful") {
      await logToDebugEndpoint(
        {
          message: `Event ${safePayload.status} received, skipping processing`,
        },
        "event_skipped",
      );
      return NextResponse.json(
        {
          success: true,
          message: `Event ${safePayload.status} not processed`,
        },
        { status: 200 },
      );
    }

    const { reference, amount, status, email, phone, fullname, updatedAt } =
      safePayload;

    // Find the pending payment
    const pendingPayment = await prisma.pendingPayment.findUnique({
      where: { reference },
      include: { enrollment: true },
    });

    if (!pendingPayment) {
      await logToDebugEndpoint(
        { message: `No pending payment found for reference: ${reference}` },
        "pending_payment_not_found",
      );
      throw new Error(`No pending payment found for reference: ${reference}`);
    }

    const paymentStatus = status === "successful" ? "completed" : "failed";
    const transactionStatus =
      paymentStatus === "completed" ? "Success" : "Failed";
    const commission = Math.min(amount * 0.1, 10000);

    // Handle metadata (assuming it might be included in payload)
    let metadata = {};
    if (typeof safePayload.metadata === "string")
      metadata = JSON.parse(safePayload.metadata);
    else if (safePayload.metadata && typeof safePayload.metadata === "object")
      metadata = safePayload.metadata;

    // Process within a transaction
    const result = await prisma.$transaction(async (tx) => {
      const existingPayment = await tx.payment.findUnique({
        where: { reference },
      });
      if (existingPayment) {
        await logToDebugEndpoint(
          { message: `Payment already processed for reference: ${reference}` },
          "duplicate_payment",
        );
        return { payment: existingPayment, transaction: null };
      }

      const payment = await tx.payment.create({
        data: {
          userId: pendingPayment.userId,
          enrollmentId: pendingPayment.enrollmentId,
          amount,
          reference,
          provider: "etegram",
          status: paymentStatus,
          planCode:
            pendingPayment.planCode || (metadata as any).plan_code || "",
          createdAt: new Date(updatedAt),
        },
      });

      await tx.pendingPayment.update({
        where: { id: pendingPayment.id },
        data: { paymentid: payment.id, status: paymentStatus },
      });

      await tx.enrollment.update({
        where: { id: pendingPayment.enrollmentId },
        data: {
          paymentStatus: paymentStatus === "completed" ? "paid" : "pending",
          lastPaymentDate: new Date(updatedAt),
          reference,
          amount,
          status:
            paymentStatus === "completed"
              ? "active"
              : pendingPayment.enrollment.status,
        },
      });

      let transaction;
      if (pendingPayment.isRenewal) {
        const healthPlan = await tx.healthPlan.findFirst({
          where: { enrollmentId: pendingPayment.enrollmentId },
          select: { id: true, myCoverPolicyId: true, endDate: true },
        });

        if (!healthPlan?.myCoverPolicyId) {
          throw new Error("No MyCover policy ID found for renewal");
        }

        const expiryDate = healthPlan.endDate || new Date();
        const today = new Date();
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        await logToDebugEndpoint(
          { daysUntilExpiry, reference },
          "renewal_expiry_check",
        );

        if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
          const renewalPayload = {
            policy_id: healthPlan.myCoverPolicyId,
            payment_plan: parseInt(pendingPayment.duration),
          };

          const renewalResponse = await fetch(
            "https://api.mycover.ai/v1/products/mcg/renew-mcg-health",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.MYCOVER_API_KEY}`,
              },
              body: JSON.stringify(renewalPayload),
            },
          );

          if (!renewalResponse.ok) {
            throw new Error(
              `Renewal API failed: ${await renewalResponse.text()}`,
            );
          }

          const renewalData = await renewalResponse.json();
          await logToDebugEndpoint(
            { renewalData, reference },
            "renewal_success",
          );

          const newExpiryDate = renewalData.data?.new_expiry_date
            ? new Date(renewalData.data.new_expiry_date)
            : null;
          if (newExpiryDate) {
            await tx.healthPlan.update({
              where: { id: healthPlan.id },
              data: { endDate: newExpiryDate },
            });
          }

          const phpEndpoint =
            process.env.PHP_LOG_ENDPOINT ||
            "https://v2.protonmedicare.com/debug/log.php";
          await fetch(phpEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiResponse: renewalData,
              userDetails: {
                userId: pendingPayment.userId,
                email: email || pendingPayment.enrollment.email,
                firstName:
                  fullname.split(/\s+/)[0] ||
                  pendingPayment.enrollment.firstName,
                lastName:
                  fullname.split(/\s+/).slice(1).join(" ") ||
                  pendingPayment.enrollment.lastName,
                reference,
              },
              timestamp: new Date().toISOString(),
            }),
          });
        } else {
          await tx.pendingRenewal.create({
            data: {
              userId: pendingPayment.userId,
              enrollmentId: pendingPayment.enrollmentId,
              healthPlanId: healthPlan.id,
              paymentId: payment.id,
              policyId: healthPlan.myCoverPolicyId,
              expiryDate,
              duration: parseInt(pendingPayment.duration),
              status: "pending",
            },
          });
          await logToDebugEndpoint(
            { policyId: healthPlan.myCoverPolicyId },
            "renewal_queued",
          );
        }
      }

      transaction = await tx.transaction.create({
        data: {
          amount,
          status: transactionStatus,
          type: (metadata as any).is_subscription ? "Renewal" : "OneTime",
          commission,
          userId: pendingPayment.userId,
          planId: pendingPayment.planCode,
          enrollmentId: pendingPayment.enrollmentId,
        },
      });

      await logToDebugEndpoint(
        {
          paymentId: payment.id,
          transactionId: transaction.id,
          reference,
        },
        "transaction_success",
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
        reference,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logToDebugEndpoint(
      {
        message: "Webhook processing error",
        error: errorMessage,
        rawBody: rawBody
          ? rawBody.substring(0, 200) + "..."
          : "No body received",
      },
      "processing_error",
    );

    const safeReference =
      payload?.reference || rawBody.match(/"reference":"([^"]+)"/)?.[1];
    if (safeReference) {
      try {
        await prisma.pendingPayment.update({
          where: { reference: safeReference },
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
          "update_error",
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Webhook processing error",
        error: errorMessage,
        rawBody: rawBody
          ? rawBody.substring(0, 200) + "..."
          : "No body received",
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
