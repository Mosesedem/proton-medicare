import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  // TODO: Implement actual email check logic here
  const exists = Math.random() < 0.5; // Placeholder logic

  return NextResponse.json({ exists });
}
