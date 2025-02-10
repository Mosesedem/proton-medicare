import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const verifySchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
});

// Handle GET request for email verification
export async function GET(req: NextRequest) {
  try {
    // Parse URL parameters
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    // Validate query parameters
    const validatedData = verifySchema.safeParse({ token, email });

    if (!validatedData.success) {
      return NextResponse.json(
        { success: false, message: "Invalid verification data" },
        { status: 400 },
      );
    }

    const { token: verificationToken, email: userEmail } = validatedData.data;

    // Check if the user exists and is not yet verified
    const user = await prisma.users.findFirst({
      where: {
        email: userEmail,
        verificationToken: verificationToken,
        isVerified: false,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 400 },
      );
    }

    // Update user verification status using Prisma transaction
    await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null,
          verificationPin: null,
          tokenExpiry: null,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Account verified successfully",
        redirect: "/signin",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during verification" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
