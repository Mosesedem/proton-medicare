// app/api/webhook/mycover/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

// Simple logging function
const log = async (message: string, data: any) => {
  console.log(`[${new Date().toISOString()}] ${message}`, data);
};

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    await log("Received webhook payload", payload);

    if (
      payload.event !== "purchase.successful" ||
      payload.data.status !== "successful"
    ) {
      await log("Invalid event or status", {
        event: payload.event,
        status: payload.data.status,
      });
      return NextResponse.json(
        { success: false, message: "Invalid event or status" },
        { status: 400 }
      );
    }

    const { meta, customer, id: policyId } = payload.data;
    const enrollmentId = meta?.policy?.meta?.mca_payload?.meta?.enrollment_id;
    const userId = meta?.policy?.meta?.mca_payload?.meta?.user_id;
    const planId = meta?.policy?.meta?.payload?.planId;

    if (!enrollmentId || !userId || !planId) {
      await log("Missing required fields", { enrollmentId, userId, planId });
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingHealthPlan = await tx.healthPlan.findFirst({
        where: { enrollmentId, userId },
      });

      const commonData = {
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        planId: planId.toString(),
        status: "active",
        startDate: new Date(payload.data.meta.policy.start_date),
        endDate: new Date(payload.data.policy_expiry_date),
        expirationDate: new Date(payload.data.policy_expiry_date),
        activationDate: new Date(payload.data.meta.policy.activation_date),
        imagePath: meta.policy.meta.mca_payload.image_url,
        hospitalListUrl: meta.policy.meta.hospital_list_url,
        updatedAt: new Date(payload.data.updated_at),

        // Additional fields from webhook
        myCoverPolicyId: policyId,
        appMode: payload.data.app_mode,
        amount: payload.data.amount,
        providerPolicyId: meta.policy.meta.provider_policy_id,
        dob: new Date(meta.policy.meta.payload.dob),
        address: meta.policy.meta.payload.address,
        groupId: meta.policy.meta.payload.groupId,
        genderId: meta.policy.meta.payload.genderId,
        dataConsent: meta.policy.meta.payload.dataConsent,
        idCardUrl: meta.policy.meta.id_card_url,
        productId: payload.data.product_id,
        paymentPlan: meta.policy.meta.payment_plan,
        profit: meta.policy.profit,
        buyerId: meta.policy.buyer_id,
        distributorId: meta.policy.distributor_id,
        providerId: meta.policy.provider_id,
        purchaseId: meta.policy.purchase_id,
        geniusPrice: meta.policy.genius_price,
        marketPrice: meta.policy.market_price,
        myCoverReferenceId: payload.data.reference,
      };

      if (existingHealthPlan) {
        await log("Updating existing health plan", { enrollmentId, userId });

        const updatedHealthPlan = await tx.healthPlan.update({
          where: { id: existingHealthPlan.id },
          data: commonData,
        });

        await tx.enrollment.update({
          where: { id: enrollmentId },
          data: {
            status: "completed",
            myCoverSyncStatus: "success",
            myCoverReferenceId: payload.data.reference,
            updatedAt: new Date(),
          },
        });

        return { action: "updated", healthPlan: updatedHealthPlan };
      } else {
        const enrollment = await tx.enrollment.findFirst({
          where: { id: enrollmentId, userId },
        });

        if (!enrollment) {
          await log("Enrollment not found", { enrollmentId, userId });
          throw new Error("Enrollment not found or user mismatch");
        }

        await log("Creating new health plan", { enrollmentId, userId });

        const newHealthPlan = await tx.healthPlan.create({
          data: {
            ...commonData,
            userId,
            enrollmentId,
            createdAt: new Date(payload.data.created_at),
            renewalDate: payload.data.meta.policy.renewal_date
              ? new Date(payload.data.meta.policy.renewal_date)
              : null,
          },
        });

        // console.log("Enrollment ID:", enrollmentId);
        await tx.enrollment.update({
          where: { id: enrollmentId },
          data: {
            status: "completed",
            myCoverSyncStatus: "success",
            myCoverReferenceId: payload.data.reference,
            updatedAt: new Date(),
          },
        });

        return { action: "created", healthPlan: newHealthPlan };
      }
    });

    await log("Webhook processed successfully", {
      action: result.action,
      healthPlanId: result.healthPlan.id,
    });

    return NextResponse.json({
      success: true,
      message: `Health plan ${result.action} successfully`,
      data: { healthPlanId: result.healthPlan.id, action: result.action },
    });
  } catch (error) {
    await log("Error processing webhook", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process webhook",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
