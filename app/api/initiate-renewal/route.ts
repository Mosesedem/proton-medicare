import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { initializePaystack } from "@/lib/paystack";
import { requireAuth } from "@/lib/auth";

// Utility function to generate a unique reference
const generateReference = () => {
  return `Proton-TX-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const prisma = new PrismaClient();

const DURATION_TO_INTERVAL_MAP = {
  "1": "monthly",
  "3": "quarterly",
  "6": "biannually",
  "12": "annually",
} as const;

type ValidDuration = keyof typeof DURATION_TO_INTERVAL_MAP;

// Helper function for safe logging
const safeLog = (message: string, data: any) => {
  try {
    console.log(message, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log(message, "Data could not be stringified:", e);
    console.log("Data type:", typeof data);
    console.log("Is null:", data === null);
    console.log("Is undefined:", data === undefined);
  }
};

export async function POST(request: Request) {
  console.log("🔄 API: /api/initiate-renewal - Request received");

  try {
    // Step 1: Parse request body
    let body;
    try {
      body = await request.json();
      safeLog("📦 Request body:", body);
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
          error:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
        },
        { status: 400 },
      );
    }

    // Step 2: Authenticate user
    console.log("🔐 Authenticating user...");
    let user;
    try {
      user = await requireAuth();
      console.log("✅ User authenticated:", user.id);
    } catch (authError) {
      console.error("❌ Authentication failed:", authError);
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          error:
            authError instanceof Error ? authError.message : String(authError),
        },
        { status: 401 },
      );
    }

    const userId = user.id;
    const email = user.email || "";

    // Step 3: Validate request data
    console.log("🔍 Validating request data...");
    const { firstName, lastName, price, plan, enrollment_id, paymentType } =
      body;

    // Check for required fields
    const missingFields = [];
    if (!firstName) missingFields.push("firstName");
    if (!lastName) missingFields.push("lastName");
    if (!price) missingFields.push("price");
    if (!plan) missingFields.push("plan");
    if (!enrollment_id) missingFields.push("enrollment_id");
    if (!paymentType) missingFields.push("paymentType");

    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
          missingFields,
        },
        { status: 400 },
      );
    }

    // Step 4: Fetch enrollment
    console.log(`🔍 Fetching enrollment with ID: ${enrollment_id}`);
    let enrollment;
    try {
      // Check if enrollment_id is a valid format before querying
      if (
        typeof enrollment_id !== "string" &&
        typeof enrollment_id !== "number"
      ) {
        console.error(
          `❌ Invalid enrollment ID format: ${typeof enrollment_id}`,
          enrollment_id,
        );
        return NextResponse.json(
          {
            success: false,
            message: "Invalid enrollment ID format",
            details: { type: typeof enrollment_id, value: enrollment_id },
          },
          { status: 400 },
        );
      }

      console.log(`🔍 Attempting to find enrollment with ID: ${enrollment_id}`);

      // Try to convert to string if it's a number
      const enrollmentIdString = String(enrollment_id);
      console.log(`🔍 Using enrollment ID as string: ${enrollmentIdString}`);

      // Convert enrollment_id to number
      const numericEnrollmentId =
        typeof enrollment_id === "string"
          ? parseInt(enrollment_id, 10)
          : enrollment_id;

      enrollment = await prisma.enrollment.findUnique({
        where: { id: numericEnrollmentId },
      });

      if (!enrollment) {
        console.error(`❌ Enrollment not found with ID: ${enrollment_id}`);
        return NextResponse.json(
          { success: false, message: "Enrollment not found" },
          { status: 404 },
        );
      }

      console.log("✅ Enrollment found:", enrollment.id);

      // Safely log enrollment details
      try {
        console.log(
          "📋 Enrollment details:",
          JSON.stringify(enrollment, null, 2),
        );
      } catch (logError) {
        console.log("⚠️ Could not stringify enrollment details:", logError);
        console.log("📋 Enrollment ID:", enrollment.id);
      }
    } catch (dbError) {
      console.error("❌ Database error when fetching enrollment:", dbError);

      // Log more details about the error
      if (dbError instanceof Error) {
        console.error("Error name:", dbError.name);
        console.error("Error message:", dbError.message);
        console.error("Error stack:", dbError.stack);
      } else {
        console.error("Non-Error object thrown:", dbError);
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch enrollment",
          error: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 },
      );
    }

    // Generate reference early for both payment types
    const reference = generateReference();
    console.log(`🔑 Generated payment reference: ${reference}`);

    if (paymentType === "subscription") {
      console.log("💳 Processing subscription payment...");

      // Step 5: Get interval from duration
      let interval;
      try {
        interval =
          DURATION_TO_INTERVAL_MAP[enrollment.duration as ValidDuration];
        console.log(
          `📅 Using interval: ${interval} for duration: ${enrollment.duration}`,
        );
      } catch (durationError) {
        console.error(
          `❌ Invalid duration: ${enrollment.duration}`,
          durationError,
        );
        return NextResponse.json(
          {
            success: false,
            message: "Invalid duration",
            error: `Duration ${enrollment.duration} is not valid`,
          },
          { status: 400 },
        );
      }

      // Step 6: Initialize Paystack
      console.log("🔄 Initializing Paystack...");
      let paystack;
      try {
        paystack = initializePaystack();
        console.log("✅ Paystack initialized successfully");
      } catch (paystackError) {
        console.error("❌ Failed to initialize Paystack:", paystackError);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to initialize payment provider",
            error:
              paystackError instanceof Error
                ? paystackError.message
                : String(paystackError),
          },
          { status: 500 },
        );
      }

      // Step 7: Create pending payment
      console.log("💾 Creating pending payment record...");
      let pendingPayment;
      try {
        const paymentData = {
          userId,
          reference,
          email,
          enrollmentId:
            typeof enrollment_id === "string"
              ? parseInt(enrollment_id, 10)
              : enrollment_id,
          provider: "paystack",
          type: "subscription",
          amount: price,
          status: "pending",
          planCode: "",
          isRenewal: true,
        };

        safeLog("📋 Pending payment data:", paymentData);

        pendingPayment = await prisma.pendingPayment.create({
          data: paymentData,
        });

        console.log("✅ Pending payment created with ID:", pendingPayment.id);
      } catch (dbError) {
        console.error("❌ Failed to create pending payment:", dbError);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to create payment record",
            error: dbError instanceof Error ? dbError.message : String(dbError),
          },
          { status: 500 },
        );
      }

      // Step 8: Create Paystack plan
      console.log("🔄 Creating Paystack plan...");
      let planResponse;
      try {
        const planData = {
          name: `${plan} Plan`,
          amount: price * 100,
          interval: interval,
        };

        safeLog("📋 Plan creation data:", planData);

        planResponse = await paystack.plan.create(planData);
        safeLog("📋 Paystack plan response:", planResponse);

        if (!planResponse.status || !planResponse.data) {
          console.error("❌ Paystack plan creation failed:", planResponse);

          // Cleanup pending payment
          try {
            await prisma.pendingPayment.delete({
              where: { id: pendingPayment.id },
            });
            console.log(
              "✅ Cleaned up pending payment after plan creation failure",
            );
          } catch (cleanupError) {
            console.error(
              "❌ Failed to clean up pending payment:",
              cleanupError,
            );
          }

          return NextResponse.json(
            {
              success: false,
              message: "Failed to create payment plan",
              error:
                planResponse.message || "Unknown error from payment provider",
            },
            { status: 500 },
          );
        }

        console.log(
          "✅ Paystack plan created with code:",
          planResponse.data.plan_code,
        );
      } catch (planError) {
        console.error("❌ Error creating Paystack plan:", planError);

        // Cleanup pending payment
        try {
          await prisma.pendingPayment.delete({
            where: { id: pendingPayment.id },
          });
          console.log(
            "✅ Cleaned up pending payment after plan creation error",
          );
        } catch (cleanupError) {
          console.error("❌ Failed to clean up pending payment:", cleanupError);
        }

        return NextResponse.json(
          {
            success: false,
            message: "Failed to create payment plan",
            error:
              planError instanceof Error
                ? planError.message
                : String(planError),
          },
          { status: 500 },
        );
      }

      // Step 9: Update pending payment with plan code
      console.log("🔄 Updating pending payment with plan code...");
      try {
        await prisma.pendingPayment.update({
          where: { id: pendingPayment.id },
          data: { planCode: planResponse.data.plan_code },
        });
        console.log("✅ Pending payment updated with plan code");
      } catch (updateError) {
        console.error(
          "❌ Failed to update pending payment with plan code:",
          updateError,
        );
        return NextResponse.json(
          {
            success: false,
            message: "Failed to update payment record",
            error:
              updateError instanceof Error
                ? updateError.message
                : String(updateError),
          },
          { status: 500 },
        );
      }

      // Step 10: Initialize Paystack transaction
      console.log("🔄 Initializing Paystack transaction...");
      let transactionResponse;
      try {
        const transactionData = {
          first_name: firstName,
          last_name: lastName,
          email: email,
          plan: planResponse.data.plan_code,
          callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-payment`,
          metadata: {
            enrollment_id,
            plan,
            plan_code: planResponse.data.plan_code,
            is_subscription: true,
            userId,
            pendingPaymentId: pendingPayment.id,
          },
          reference: reference,
          amount: 0,
        };

        safeLog("📋 Transaction initialization data:", transactionData);

        transactionResponse =
          await paystack.transaction.initialize(transactionData);
        safeLog("📋 Transaction response:", transactionResponse);

        if (!transactionResponse.status || !transactionResponse.data) {
          console.error(
            "❌ Transaction initialization failed:",
            transactionResponse,
          );

          // Cleanup pending payment
          try {
            await prisma.pendingPayment.delete({
              where: { id: pendingPayment.id },
            });
            console.log(
              "✅ Cleaned up pending payment after transaction initialization failure",
            );
          } catch (cleanupError) {
            console.error(
              "❌ Failed to clean up pending payment:",
              cleanupError,
            );
          }

          return NextResponse.json(
            {
              success: false,
              message: "Failed to initialize transaction",
              error:
                transactionResponse.message ||
                "Unknown error from payment provider",
            },
            { status: 500 },
          );
        }

        console.log("✅ Transaction initialized successfully");
      } catch (transactionError) {
        console.error("❌ Error initializing transaction:", transactionError);

        // Cleanup pending payment
        try {
          await prisma.pendingPayment.delete({
            where: { id: pendingPayment.id },
          });
          console.log("✅ Cleaned up pending payment after transaction error");
        } catch (cleanupError) {
          console.error("❌ Failed to clean up pending payment:", cleanupError);
        }

        return NextResponse.json(
          {
            success: false,
            message: "Failed to initialize transaction",
            error:
              transactionError instanceof Error
                ? transactionError.message
                : String(transactionError),
          },
          { status: 500 },
        );
      }

      console.log("✅ Subscription payment flow completed successfully");
      return NextResponse.json({
        success: true,
        message: "Subscription payment initiated",
        reference,
        authorization_url: transactionResponse.data.authorization_url,
        plan_code: planResponse.data.plan_code,
      });
    } else if (paymentType === "onetime") {
      console.log("💰 Processing one-time payment...");

      // Create pending payment for one-time payment
      let pendingPayment;
      try {
        const paymentData = {
          userId,
          reference,
          email,
          enrollmentId:
            typeof enrollment_id === "string"
              ? parseInt(enrollment_id, 10)
              : enrollment_id,
          provider: "etegram",
          type: "onetime",
          amount: price,
          status: "pending",
          planCode: plan,
          isRenewal: true,
        };

        safeLog("📋 One-time payment data:", paymentData);

        pendingPayment = await prisma.pendingPayment.create({
          data: paymentData,
        });

        console.log(
          "✅ One-time pending payment created with ID:",
          pendingPayment.id,
        );
      } catch (dbError) {
        console.error("❌ Failed to create one-time pending payment:", dbError);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to create payment record",
            error: dbError instanceof Error ? dbError.message : String(dbError),
          },
          { status: 500 },
        );
      }

      console.log("✅ One-time payment flow completed successfully");
      return NextResponse.json({
        success: true,
        message: "One-time payment ready",
        reference,
        metadata: {
          pendingPaymentId: pendingPayment.id,
        },
      });
    } else {
      console.error(`❌ Invalid payment type: ${paymentType}`);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment type. Must be 'subscription' or 'onetime'",
          paymentType,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    // Enhanced error logging
    console.error("❌ Unhandled error in payment initiation:");
    console.error("Error type:", typeof error);
    console.error("Is error null?", error === null);
    console.error("Is error undefined?", error === undefined);

    if (error === null) {
      console.error(
        "Error is null - this is likely causing the 'payload' argument error",
      );
      return NextResponse.json(
        {
          success: false,
          message: "Failed to initiate payment due to null error",
          error: "Null error encountered",
        },
        { status: 500 },
      );
    }

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Non-Error object thrown:", error);
      try {
        console.error("Stringified error:", JSON.stringify(error));
      } catch (stringifyError) {
        console.error("Could not stringify error:", stringifyError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to initiate payment",
        error:
          error instanceof Error
            ? error.message
            : String(error || "Unknown error"),
      },
      { status: 500 },
    );
  } finally {
    try {
      await prisma.$disconnect();
      console.log("✅ Prisma client disconnected");
    } catch (disconnectError) {
      console.error("❌ Error disconnecting Prisma client:", disconnectError);
    }
    console.log("🏁 API: /api/initiate-renewal - Request completed");
  }
}
