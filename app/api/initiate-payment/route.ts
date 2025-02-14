import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { initializePaystack } from "@/lib/paystack";

const prisma = new PrismaClient();

const DURATION_TO_INTERVAL_MAP = {
  "1": "monthly",
  "3": "quarterly",
  "6": "biannually",
  "12": "annually",
} as const;

type ValidDuration = keyof typeof DURATION_TO_INTERVAL_MAP;

export async function POST(request: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      price,
      plan,
      enrollment_id,
      paymentType,
    } = await request.json();

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollment_id },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, message: "Enrollment not found" },
        { status: 404 },
      );
    }

    const paystack = initializePaystack();

    if (paymentType === "subscription") {
      try {
        console.log("Enrollment duration:", enrollment.duration);

        if (
          !enrollment.duration ||
          !(enrollment.duration in DURATION_TO_INTERVAL_MAP)
        ) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid duration: ${enrollment.duration}. Valid values are: 1, 3, 6, 12`,
            },
            { status: 400 },
          );
        }

        const interval =
          DURATION_TO_INTERVAL_MAP[enrollment.duration as ValidDuration];

        console.log("Creating plan with interval:", interval);

        // Create or fetch existing plan
        const planResponse = await paystack.plan.create({
          name: `${plan} Plan`,
          amount: price * 100,
          interval: interval,
        });

        console.log("Plan creation response:", planResponse);

        if (!planResponse.status || !planResponse.data) {
          throw new Error(
            `Failed to create plan: ${planResponse.message || "Unknown error"}`,
          );
        }

        // Instead of directly creating a subscription, initialize a transaction with the plan
        const transactionResponse = await paystack.transaction.initialize({
          first_name: firstName,
          last_name: lastName,
          email: email,
          amount: price * 100,
          callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-payment`,
          metadata: {
            enrollment_id,
            plan: plan,
            plan_code: planResponse.data.plan_code,
            is_subscription: true,
          },
        });

        console.log(
          "Transaction initialization response:",
          transactionResponse,
        );

        if (!transactionResponse.status || !transactionResponse.data) {
          throw new Error("Failed to initialize transaction");
        }

        return NextResponse.json({
          success: true,
          message: "Subscription payment initiated",
          reference: transactionResponse.data.reference,
          authorization_url: transactionResponse.data.authorization_url,
        });
      } catch (error) {
        console.error("Subscription initiation error:", error);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to initiate subscription",
            error: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        );
      }
    } else {
      // One-time payment logic
      try {
        const transactionResponse = await paystack.transaction.initialize({
          first_name: firstName,
          last_name: lastName,
          email: email,
          amount: price * 100,
          callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-payment`,
          metadata: {
            enrollment_id,
            plan,
            is_subscription: false,
          },
        });

        console.log(
          "Transaction initialization response:",
          transactionResponse,
        );

        if (!transactionResponse.status || !transactionResponse.data) {
          throw new Error("Failed to initialize transaction");
        }

        return NextResponse.json({
          success: true,
          message: "Payment initiated",
          reference: transactionResponse.data.reference,
          authorization_url: transactionResponse.data.authorization_url,
        });
      } catch (error) {
        console.error("Transaction initialization error:", error);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to initiate payment",
            error: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to initiate payment",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
