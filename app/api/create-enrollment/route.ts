import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  // TODO: Implement actual enrollment creation logic here
  const success = Math.random() < 0.95; // Placeholder logic
  const enrollment_id = Math.floor(Math.random() * 1000000);

  if (success) {
    return NextResponse.json({
      success: true,
      message: "Enrollment created",
      enrollment_id,
    });
  } else {
    return NextResponse.json(
      { success: false, message: "Failed to create enrollment" },
      { status: 500 },
    );
  }
}
