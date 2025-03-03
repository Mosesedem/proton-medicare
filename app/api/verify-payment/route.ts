import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { initializePaystack } from "@/lib/paystack";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json(
      { success: false, error: "No reference provided" },
      { status: 400 },
    );
  }

  try {
    const paystack = initializePaystack();
    const response = await paystack.transaction.verify(reference);

    if (response.data.status === "success") {
      // Update enrollment status using Prisma
      await prisma.enrollment.updateMany({
        where: {
          email: response.data.customer.email,
          id: response.data.metadata.enrollmentId,
          paymentStatus: "pending",
        },
        data: {
          paymentStatus: "completed",
        },
      });

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      );
    } else {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/payment-failed`,
      );
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
