import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password, firstName, lastName } = await request.json();

  // TODO: Implement actual registration logic here
  const success = Math.random() < 0.9; // Placeholder logic

  if (success) {
    return NextResponse.json({
      success: true,
      message: "Registration successful",
    });
  } else {
    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 400 },
    );
  }
}
