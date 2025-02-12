import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    const exists = user !== null;

    return NextResponse.json({
      exists,
      success: true,
      message: "Login to continue",
    }); // Explicit success indicator
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Operation failed. Please try again later." },
      { status: 500 },
    ); // More user-friendly error message
  } finally {
    await prisma.$disconnect();
  }
}
