import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";

const prisma = new PrismaClient();

// Schema validation for input data
const emailSchema = z.object({ email: z.string().email() });
const pinSchema = z.object({
  email: z.string().email(),
  pin: z.string().length(6),
});
const resetSchema = z.object({
  email: z.string().email(),
  pin: z.string().length(6),
  new_password: z.string().min(8),
});

// Generate a 6-digit PIN
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// **Send Reset PIN**
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "send_email") {
      const validated = emailSchema.safeParse(body);
      if (!validated.success)
        return NextResponse.json(
          { success: false, message: "Invalid email" },
          { status: 400 },
        );

      const { email } = validated.data;
      const pin = generatePin();

      await prisma.users.updateMany({
        where: { email },
        data: {
          resetPin: pin,
          resetPinExpiry: new Date(Date.now() + 10 * 60 * 1000),
        }, // 10-minute expiry
      });

      // Send PIN via email (use a real email service like Resend or Nodemailer)
      console.log(`Reset PIN for ${email}: ${pin}`);

      return NextResponse.json({
        success: true,
        message: "Reset PIN sent successfully.",
      });
    }

    // **Verify PIN**
    if (action === "verify_pin") {
      const validated = pinSchema.safeParse(body);
      if (!validated.success)
        return NextResponse.json(
          { success: false, message: "Invalid PIN format" },
          { status: 400 },
        );

      const { email, pin } = validated.data;
      const user = await prisma.users.findFirst({
        where: { email, resetPin: pin },
      });

      if (!user || new Date() > new Date(user.resetPinExpiry!)) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired PIN" },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "PIN verified successfully.",
      });
    }

    // **Reset Password**
    if (action === "reset_password") {
      const validated = resetSchema.safeParse(body);
      if (!validated.success)
        return NextResponse.json(
          { success: false, message: "Invalid password data" },
          { status: 400 },
        );

      const { email, pin, new_password } = validated.data;
      const user = await prisma.users.findFirst({
        where: { email, resetPin: pin },
      });

      if (!user || new Date() > new Date(user.resetPinExpiry!)) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired PIN" },
          { status: 400 },
        );
      }

      // Hash the password before saving
      const hashedPassword = crypto
        .createHash("sha256")
        .update(new_password)
        .digest("hex");

      await prisma.users.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPin: null,
          resetPinExpiry: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password reset successfully.",
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error handling password reset:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
