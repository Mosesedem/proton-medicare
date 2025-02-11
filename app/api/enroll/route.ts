import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initializePaystack } from "@/lib/paystack";

export async function POST(request: Request) {
  const body = await request.json();
  const { firstName, lastName, email, plan, paymentMethod } = body;

  try {
    // Save enrollment data to the database
    await sql`
      INSERT INTO enrollments (first_name, last_name, email, plan, payment_method, status)
      VALUES (${firstName}, ${lastName}, ${email}, ${plan}, ${paymentMethod}, 'pending')
    `;

    // Initialize Paystack payment
    const paystack = initializePaystack();
    const response = await paystack.transaction.initialize({
      email,
      amount: getPlanAmount(plan) * 100, // Convert to kobo
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-payment`,
    });

    return NextResponse.json({
      success: true,
      paymentUrl: response.data.authorization_url,
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { success: false, error: "Enrollment failed" },
      { status: 500 },
    );
  }
}

function getPlanAmount(plan: string): number {
  switch (plan) {
    case "basic":
      return 1000;
    case "pro":
      return 2000;
    case "enterprise":
      return 5000;
    default:
      return 0;
  }
}
