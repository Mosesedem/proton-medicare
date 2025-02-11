import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // TODO: Implement actual login logic here
  const success = Math.random() < 0.8; // Placeholder logic

  if (success) {
    return NextResponse.json({ success: true, message: "Login successful" });
  } else {
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 401 },
    );
  }
}
