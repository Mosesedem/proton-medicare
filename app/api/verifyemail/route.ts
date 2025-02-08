// /api/verifyemail/route.ts

"use server";

import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import { z } from "zod";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schemas
const emailSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const verifyPinSchema = z.object({
  email: z.string().email("Invalid email format"),
  pin: z.string().length(6, "PIN must be 6 digits"),
});

// Generate verification details
function generateVerificationDetails() {
  return {
    token: randomBytes(32).toString("hex"),
    pin: Math.floor(100000 + Math.random() * 900000).toString(),
    tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };
}

// Email template
function getEmailTemplate(
  firstName: string,
  verificationLink: string,
  verificationPin: string,
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Verify Your Email</title>
        <style>
            body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #00897b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 12px 24px; background-color: #00897b; color: white; text-decoration: none; 
                     border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .pin-box { font-size: 20px; font-weight: bold; color: #00897b; text-align: center; background-color: #f9f9f9;
                      padding: 10px 15px; border: 1px dashed #00897b; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to ProtonMedicare! ✨</h1>
            </div>
            <div class="content">
                <h2>Hey ${firstName}! 👋</h2>
                <p>We're thrilled to have you join our community! 🎉</p>
                <p>Please verify your email address to start using your account. You can do this in two ways:</p>
                
                <div style="text-align: center;">
                    <a href="${verificationLink}" class="button">
                        Verify My Email 🚀
                    </a>
                </div>
                
                <p>or</p>
                
                <p>Use this PIN to verify your email address:</p>
                <div class="pin-box">
                    ${verificationPin}
                </div>
                
                <p>This link and PIN will expire in 24 hours ⏰</p>
                
                <p>If you didn't create an account, you can safely ignore this email 💌</p>
                
                <div class="footer">
                    <p>Need help? Reply to this email or contact our support team 💪</p>
                    <p>© ${new Date().getFullYear()} ProtonMedicare. All rights reserved. 🏥</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Send verification email
async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string,
  pin: string,
) {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  try {
    const { data, error } = await resend.emails.send({
      from: "ProtonMedicare <noreply@protonmedicare.com>",
      to: email,
      subject: "✨ Verify Your ProtonMedicare Account",
      html: getEmailTemplate(firstName, verificationLink, pin),
    });

    if (error) {
      console.error("Email sending error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}

// Server actions
export async function updateEmail(prevState: any, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) {
      return { success: false, message: "Not authenticated" };
    }

    const newEmail = formData.get("email") as string;
    const validatedData = emailSchema.parse({ email: newEmail });

    // Check if email exists
    const existingUser = await prisma.users.findFirst({
      where: {
        email: validatedData.email.toLowerCase(),
        id: { not: userId },
      },
    });

    if (existingUser) {
      return { success: false, message: "Email address already in use" };
    }

    // Get user details
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Generate verification details
    const verificationDetails = generateVerificationDetails();

    // Update user
    await prisma.users.update({
      where: { id: userId },
      data: {
        email: validatedData.email.toLowerCase(),
        isVerified: false,
        verificationToken: verificationDetails.token,
        verificationPin: verificationDetails.pin,
        tokenExpiry: verificationDetails.tokenExpiry,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(
      validatedData.email,
      user.firstName ?? "",
      verificationDetails.token,
      verificationDetails.pin,
    );

    if (!emailSent) {
      return { success: false, message: "Failed to send verification email" };
    }

    return {
      success: true,
      message:
        "Email updated. Please check your inbox for verification instructions.",
    };
  } catch (error) {
    console.error("Update email error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return {
      success: false,
      message: "An error occurred. Please try again later.",
    };
  }
}

export async function resendVerificationCode(
  prevState: any,
  formData: FormData,
) {
  try {
    const email = formData.get("email") as string;
    const validatedData = emailSchema.parse({ email });

    // Get user details
    const user = await prisma.users.findFirst({
      where: {
        email: validatedData.email.toLowerCase(),
        isVerified: false,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "No pending verification found for this email",
      };
    }

    // Generate new verification details
    const verificationDetails = generateVerificationDetails();

    // Update user
    await prisma.users.update({
      where: { id: user.id },
      data: {
        verificationToken: verificationDetails.token,
        verificationPin: verificationDetails.pin,
        tokenExpiry: verificationDetails.tokenExpiry,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(
      validatedData.email,
      user.firstName ?? "",
      verificationDetails.token,
      verificationDetails.pin,
    );

    if (!emailSent) {
      return { success: false, message: "Failed to send verification email" };
    }

    return { success: true, message: "Verification email sent successfully" };
  } catch (error) {
    console.error("Resend verification error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return {
      success: false,
      message: "An error occurred. Please try again later.",
    };
  }
}

export async function verifyEmail(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const pin = formData.get("pin") as string;

    const validatedData = verifyPinSchema.parse({ email, pin });

    // Verify PIN
    const user = await prisma.users.findFirst({
      where: {
        email: validatedData.email.toLowerCase(),
        verificationPin: validatedData.pin,
        tokenExpiry: { gt: new Date() },
        isVerified: false,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "Invalid or expired verification code",
      };
    }

    // Mark as verified
    await prisma.users.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationPin: null,
        tokenExpiry: null,
      },
    });

    return {
      success: true,
      message: "Email verified successfully",
      redirect: "/dashboard",
    };
  } catch (error) {
    console.error("Verify email error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return {
      success: false,
      message: "An error occurred. Please try again later.",
    };
  }
}
