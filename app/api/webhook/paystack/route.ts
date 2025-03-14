import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

interface PaystackWebhookPayload {
  event: "charge.success" | "charge.failed" | string;
  data: {
    id: number;
    reference: string;
    amount: number;
    status: "success" | "failed" | string;
    customer: {
      email: string;
      first_name: string | null;
      last_name: string | null;
    };
    paidAt: string;
    metadata: any;
  };
}

export async function POST(request: Request) {
  let rawBody: string = "";
  let payload: PaystackWebhookPayload | undefined;

  try {
    console.log("Webhook processing started at:", new Date().toISOString());
    rawBody = await request.text();
    if (!rawBody) throw new Error("Empty request body");

    payload = JSON.parse(rawBody);
    if (!payload?.event || !payload.data)
      throw new Error("Invalid payload structure");

    if (payload.event !== "charge.success") {
      console.log(`Event ${payload.event} received, skipping processing`);
      return NextResponse.json(
        { success: true, message: `Event ${payload.event} not processed` },
        { status: 200 },
      );
    }

    const { data } = payload;
    const { reference, amount, status, customer, paidAt } = data;
    const parsedAmount = amount / 100;

    const pendingPayment = await prisma.pendingPayment.findUnique({
      where: { reference },
      include: { enrollment: true },
    });
    if (!pendingPayment) {
      throw new Error(`No pending payment found for reference: ${reference}`);
    }

    const paymentStatus = status === "success" ? "completed" : "failed";
    const transactionStatus =
      paymentStatus === "completed" ? "Success" : "Failed";
    const commission = Math.min(parsedAmount * 0.1, 10000);

    let metadata = {};
    if (typeof data.metadata === "string") metadata = JSON.parse(data.metadata);
    else if (data.metadata && typeof data.metadata === "object")
      metadata = data.metadata;

    const result = await prisma.$transaction(async (tx) => {
      const existingPayment = await tx.payment.findUnique({
        where: { reference },
      });
      if (existingPayment) {
        console.log(`Payment already processed for reference: ${reference}`);
        return { payment: existingPayment, transaction: null };
      }

      const payment = await tx.payment.create({
        data: {
          userId: pendingPayment.userId,
          enrollmentId: pendingPayment.enrollmentId,
          amount: parsedAmount,
          reference,
          provider: "paystack",
          status: paymentStatus,
          planCode:
            pendingPayment.planCode || (metadata as any).plan_code || "",
          createdAt: new Date(paidAt),
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
          lastPaymentDate: new Date(paidAt),
          reference,
          amount: parsedAmount,
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

        const expiryDate = healthPlan.endDate || new Date(); // Fallback if missing
        const today = new Date();
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        console.log("Days until expiry:", daysUntilExpiry);

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
          console.log("Renewal successful:", renewalData);

          // Update expiryDate if provided by MyCover
          const newExpiryDate = renewalData.data?.new_expiry_date
            ? new Date(renewalData.data.new_expiry_date)
            : null;
          if (newExpiryDate) {
            await tx.healthPlan.update({
              where: { id: healthPlan.id },
              data: { endDate: newExpiryDate },
            });
          }

          // Log to PHP endpoint
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
                email: customer.email,
                firstName: customer.first_name,
                lastName: customer.last_name,
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
          console.log("Renewal queued for policy:", healthPlan.myCoverPolicyId);
        }
      }

      transaction = await tx.transaction.create({
        data: {
          amount: parsedAmount,
          status: transactionStatus,
          type: (metadata as any).is_subscription ? "Renewal" : "OneTime",
          commission,
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
        reference,
      },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    const safeReference =
      payload?.data?.reference || rawBody.match(/"reference":"([^"]+)"/)?.[1];
    if (safeReference) {
      await prisma.pendingPayment
        .update({
          where: { reference: safeReference },
          data: { status: "failed" },
        })
        .catch((updateError) =>
          console.error("Failed to update pending payment:", updateError),
        );
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
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
