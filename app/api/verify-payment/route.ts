import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initializePaystack } from "@/lib/paystack";

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
      // Update enrollment status in the database
      await sql`
        UPDATE enrollments
        SET status = 'completed'
        WHERE email = ${response.data.customer.email}
        AND status = 'pending'
      `;

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
  }
}
