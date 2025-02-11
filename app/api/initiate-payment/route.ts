import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, price, plan, enrollment_id, paymentType } =
    await request.json();

  // TODO: Implement actual payment initiation logic here
  const success = Math.random() < 0.98; // Placeholder logic
  const reference = `PAY-${Math.random().toString(36).substr(2, 9)}`;

  if (success) {
    return NextResponse.json({
      success: true,
      message: "Payment initiated",
      reference,
    });
  } else {
    return NextResponse.json(
      { success: false, message: "Failed to initiate payment" },
      { status: 500 },
    );
  }
}
