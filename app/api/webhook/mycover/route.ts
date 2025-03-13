import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { string } from "zod";

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
        { status: 400 },
      );
    }

    const { meta, customer, id: policyId } = payload.data;

    // Extract enrollment ID and user ID with fallback paths
    const enrollmentId = meta?.policy?.meta?.mca_payload?.meta?.enrollment_id;
    const userId = meta?.policy?.meta?.mca_payload?.meta?.user_id;

    // Handle both webhook types for plan ID
    let planId = meta?.policy?.meta?.payload?.planId; // Type 2 format

    // If planId is not found, try the type 1 format (plan_id)
    if (!planId && meta?.policy?.meta?.payload?.plan_id) {
      planId = meta?.policy?.meta?.payload?.plan_id;
    }

    if (!enrollmentId || !userId) {
      await log("Missing required fields", { enrollmentId, userId, planId });
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingHealthPlan = await tx.healthPlan.findFirst({
        where: { enrollmentId, userId },
      });

      // Enhanced getNestedValue with type conversion
      const getNestedValue = (
        obj: any,
        path: string,
        defaultValue: any = null,
        converter?: (val: any) => any,
      ) => {
        const keys = path.split(".");
        const value = keys.reduce(
          (acc, key) =>
            acc && acc[key] !== undefined ? acc[key] : defaultValue,
          obj,
        );
        return converter && value !== defaultValue ? converter(value) : value;
      };

      // Safe data extraction
      const startDate = getNestedValue(
        payload,
        "data.meta.policy.start_date",
        payload.data.start_date,
      );
      const expiryDate = getNestedValue(
        payload,
        "data.policy_expiry_date",
        payload.data.expiration_date,
      );
      const activationDate = getNestedValue(
        payload,
        "data.meta.policy.activation_date",
        payload.data.activation_date,
      );
      const imageUrl = getNestedValue(
        payload,
        "data.meta.policy.meta.mca_payload.image_url",
        getNestedValue(payload, "data.meta.policy.meta.id_image", null),
      );
      const hospitalListUrl = getNestedValue(
        payload,
        "data.meta.policy.meta.hospital_list_url",
        null,
      );
      const providerPolicyId = getNestedValue(
        payload,
        "data.meta.policy.meta.provider_policy_id",
        getNestedValue(payload, "data.meta.policy.meta.hmo_policy_id", null),
        (val) => (val !== null ? parseInt(val, 10) : null),
      );
      const hmoPolicyId = getNestedValue(
        payload,
        "data.meta.policy.meta.hmo_policy_id",
        getNestedValue(payload, "data.meta.policy.meta.hmo_policy_id", null),
        (val) => (val !== null ? val.toString() : null),
      );
      const dobString = getNestedValue(
        payload,
        "data.meta.policy.dob",
        getNestedValue(payload, "data.meta.policy.meta.payload.dob", null),
      );

      // Get address data with different possible paths
      let address = getNestedValue(
        payload,
        "data.meta.policy.meta.payload.address",
        null,
      );

      // Extract additional fields safely with type conversions
      const groupId = getNestedValue(
        payload,
        "data.meta.policy.meta.payload.groupId",
        null,
        (val) => (val !== null ? parseInt(val, 10) : null),
      );
      const genderId = getNestedValue(
        payload,
        "data.meta.policy.meta.payload.genderId",
        null,
        (val) => (val !== null ? parseInt(val, 10) : null),
      );
      // const dataConsent = getNestedValue(
      //   payload,
      //   "data.meta.policy.meta.payload.dataConsent",
      //   null,
      //   (val) =>
      //     val !== null && typeof val === "string" ? val === "true" : val,
      // );
      const idCardUrl = getNestedValue(
        payload,
        "data.meta.policy.meta.id_card_url",
        null,
      );
      const paymentPlan = getNestedValue(
        payload,
        "data.meta.policy.meta.payment_plan",
        null,
        (val) => (val !== null ? parseInt(val, 10) : null),
      );

      // Convert numeric fields to appropriate types
      const amount = parseFloat(payload.data.amount) || 0;
      const profit = getNestedValue(
        payload,
        "data.meta.policy.profit",
        null,
        (val) => (val !== null ? parseFloat(val) : null),
      );
      const geniusPrice = getNestedValue(
        payload,
        "data.meta.policy.genius_price",
        null,
        (val) => (val !== null ? parseFloat(val) : null),
      );
      const marketPrice = getNestedValue(
        payload,
        "data.meta.policy.market_price",
        null,
        (val) => (val !== null ? parseFloat(val) : null),
      );

      const commonData = {
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        planId: planId ? planId.toString() : undefined,
        status: "active",
        startDate: startDate ? new Date(startDate) : new Date(),
        ...(expiryDate && { endDate: new Date(expiryDate) }),
        ...(expiryDate && { expirationDate: new Date(expiryDate) }),
        activationDate: activationDate ? new Date(activationDate) : new Date(),
        imagePath: imageUrl,
        hospitalListUrl,
        updatedAt: new Date(payload.data.updated_at),

        // Additional fields from webhook with proper type conversions
        myCoverPolicyId: policyId,
        appMode: payload.data.app_mode,
        amount,
        providerPolicyId,
        hmoPolicyId: hmoPolicyId.toString(),
        dob: dobString ? new Date(dobString) : null,
        address,
        groupId,
        genderId,
        // dataConsent,
        idCardUrl,
        productId: payload.data.product_id,
        paymentPlan,
        profit,
        buyerId: getNestedValue(payload, "data.meta.policy.buyer_id", null),
        distributorId: getNestedValue(
          payload,
          "data.meta.policy.distributor_id",
          null,
        ),
        providerId: getNestedValue(
          payload,
          "data.meta.policy.provider_id",
          null,
        ),
        purchaseId: getNestedValue(
          payload,
          "data.meta.policy.purchase_id",
          null,
        ),
        geniusPrice,
        marketPrice,
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

        const renewalDateStr = getNestedValue(
          payload,
          "data.meta.policy.renewal_date",
          null,
        );

        const newHealthPlan = await tx.healthPlan.create({
          data: {
            ...commonData,
            createdAt: new Date(payload.data.created_at),
            renewalDate: renewalDateStr ? new Date(renewalDateStr) : null,
            User: {
              connect: { id: userId },
            },
            enrollment: {
              connect: { id: enrollmentId },
            },
          },
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
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
