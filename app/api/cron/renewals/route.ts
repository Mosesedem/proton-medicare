import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Secure the endpoint with a secret token
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    console.log("Renewal processing started:", new Date().toISOString());

    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const renewals = await prisma.pendingRenewal.findMany({
      where: {
        status: "pending",
        expiryDate: {
          lte: threeDaysFromNow,
          gte: today,
        },
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        payment: { select: { id: true, reference: true } },
        enrollment: { select: { id: true } },
        healthPlan: {
          select: { id: true, myCoverPolicyId: true, endDate: true },
        },
      },
    });

    if (renewals.length === 0) {
      console.log("No renewals to process.");
      return NextResponse.json({
        success: true,
        message: "No renewals to process",
      });
    }

    for (const renewal of renewals) {
      try {
        const renewalPayload = {
          policy_id: renewal.policyId,
          payment_plan: renewal.duration,
        };

        const response = await fetch(
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

        if (!response.ok) {
          throw new Error(`Renewal failed: ${await response.text()}`);
        }

        const renewalData = await response.json();
        console.log(
          `Renewal processed for policy ${renewal.policyId}:`,
          renewalData,
        );

        const newExpiryDate = renewalData.data?.new_expiry_date
          ? new Date(renewalData.data.new_expiry_date)
          : null;

        await prisma.$transaction([
          prisma.pendingRenewal.update({
            where: { id: renewal.id },
            data: { status: "processed" },
          }),
          prisma.enrollment.update({
            where: { id: renewal.enrollmentId },
            data: { status: "active", lastPaymentDate: new Date() },
          }),
          ...(newExpiryDate
            ? [
                prisma.healthPlan.update({
                  where: { id: renewal.healthPlanId },
                  data: { endDate: newExpiryDate },
                }),
              ]
            : []),
        ]);

        const phpEndpoint =
          process.env.PHP_LOG_ENDPOINT ||
          "https://v2.protonmedicare.com/debug/log.php";
        await fetch(phpEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiResponse: renewalData,
            userDetails: {
              userId: renewal.userId,
              email: renewal.user.email,
              firstName: renewal.user.firstName,
              lastName: renewal.user.lastName,
              reference: renewal.payment.reference,
            },
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error(`Failed to process renewal ${renewal.id}:`, error);
        await prisma.pendingRenewal.update({
          where: { id: renewal.id },
          data: { status: "failed" },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Renewals processed" });
  } catch (error) {
    console.error("Renewal processing error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Renewal processing failed",
        error: String(error),
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Optional: For manual testing
export async function GET() {
  return NextResponse.json({ message: "Use POST to trigger renewals" });
}
