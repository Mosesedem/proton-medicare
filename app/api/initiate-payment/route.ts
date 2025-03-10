import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { initializePaystack } from "@/lib/paystack";
import { requireAuth } from "@/lib/auth";

// Utility function to generate a unique reference
const generateReference = () => {
  return `Proton-TX-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
};

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
    const user = await requireAuth();
    const userId = user.id;
    const email = user.email || "";
    const body = await request.json();
    const { firstName, lastName, price, plan, enrollment_id, paymentType } =
      body;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollment_id },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, message: "Enrollment not found" },
        { status: 404 }
      );
    }

    // Generate reference early for both payment types
    const reference = generateReference();

    if (paymentType === "subscription") {
      const interval =
        DURATION_TO_INTERVAL_MAP[enrollment.duration as ValidDuration];
      const paystack = initializePaystack();

      // Create pending payment before initiating subscription
      const pendingPayment = await prisma.pendingPayment.create({
        data: {
          userId,
          reference,
          email,
          enrollmentId: enrollment_id,
          provider: "paystack",
          type: "subscription",
          amount: price,
          status: "pending",
          planCode: "", // Will be updated after plan creation
        },
      });

      const planResponse = await paystack.plan.create({
        name: `${plan} Plan`,
        amount: price * 100,
        interval: interval,
      });

      if (!planResponse.status || !planResponse.data) {
        // Cleanup pending payment if plan creation fails
        await prisma.pendingPayment.delete({
          where: { id: pendingPayment.id },
        });
        throw new Error(`Failed to create plan: ${planResponse.message}`);
      }

      // Update pending payment with plan code
      await prisma.pendingPayment.update({
        where: { id: pendingPayment.id },
        data: { planCode: planResponse.data.plan_code },
      });

      const transactionResponse = await paystack.transaction.initialize({
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
          pendingPaymentId: pendingPayment.id, // Add pending payment ID to metadata
        },
        reference: reference,
        amount: 0,
        name: "",
      });

      if (!transactionResponse.status || !transactionResponse.data) {
        // Cleanup pending payment if transaction initialization fails
        await prisma.pendingPayment.delete({
          where: { id: pendingPayment.id },
        });
        throw new Error("Failed to initialize transaction");
      }

      return NextResponse.json({
        success: true,
        message: "Subscription payment initiated",
        reference,
        authorization_url: transactionResponse.data.authorization_url,
        plan_code: planResponse.data.plan_code,
      });
    } else if (paymentType === "onetime") {
      // Create pending payment for one-time payment
      const pendingPayment = await prisma.pendingPayment.create({
        data: {
          userId,
          reference,
          email,
          enrollmentId: enrollment_id,
          provider: "etegram",
          type: "onetime",
          amount: price,
          status: "pending",
          planCode: plan, // Using plan name as planCode for one-time
        },
      });

      return NextResponse.json({
        success: true,
        message: "One-time payment ready",
        reference,
        metadata: {
          pendingPaymentId: pendingPayment.id, // Include in response for client-side tracking
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid payment type: ${paymentType}. Must be 'subscription' or 'one-time'`,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to initiate payment",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
