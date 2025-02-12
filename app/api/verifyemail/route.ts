"use server";

import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import { z } from "zod";
import { randomBytes } from "crypto";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Initialize Prisma and Resend with error handling
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY is not defined");
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.error("NEXT_PUBLIC_APP_URL is not defined");
}

// Validation schemas
const emailSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const verifyPinSchema = z.object({
  email: z.string().email("Invalid email format"),
  pin: z.string().length(6, "PIN must be 6 digits"),
});

// Type definitions
interface VerificationDetails {
  token: string;
  pin: string;
  tokenExpiry: Date;
}

// Generate verification details
function generateVerificationDetails(): VerificationDetails {
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
): string {
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
                <h2>Hey 
${firstName}
! 👋</h2>
                <p>We're thrilled to have you join our community! 🎉</p>
                <p>Please verify your email address to start using your account. You can do this in two ways:</p>
                <div style="text-align: center;">
                    <a href="
${verificationLink}
" class="button">
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
                    <p>© 
${new Date().getFullYear()}
 ProtonMedicare. All rights reserved. 🏥</p>
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
): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error("NEXT_PUBLIC_APP_URL is not defined");
    return false;
  }

  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  try {
    const { data, error } = await resend.emails.send({
      from: "Proton Medicare <hq@hq.protonmedicare.com>",
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

// Update email function
async function updateEmail(formData: FormData) {
  const schema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const parse = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parse.success) {
    return {
      success: false,
      message: parse.error.errors[0].message || "Invalid input",
    };
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return {
        success: false,
        message: "Server configuration error",
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as {
        id: string;
        email: string;
      };
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return {
        success: false,
        message: "Invalid or expired authentication token",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.id) },
    });

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const passwordMatch = await compare(parse.data.password, user.password);
    if (!passwordMatch) {
      return {
        success: false,
        message: "Incorrect password",
      };
    }

    const normalizedEmail = parse.data.email.toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        id: { not: parseInt(decoded.id) },
      },
    });

    if (existingUser) {
      return {
        success: false,
        message: "Email address is already in use",
      };
    }

    const verificationDetails = generateVerificationDetails();

    await prisma.user.update({
      where: { id: parseInt(decoded.id) },
      data: {
        email: normalizedEmail,
        isVerified: false,
        verificationToken: verificationDetails.token,
        verificationPin: verificationDetails.pin,
        tokenExpiry: verificationDetails.tokenExpiry,
      },
    });

    const emailSent = await sendVerificationEmail(
      normalizedEmail,
      user.firstName ?? "",
      verificationDetails.token,
      verificationDetails.pin,
    );

    if (!emailSent) {
      return {
        success: false,
        message: "Failed to send verification email",
      };
    }

    return {
      success: true,
      message:
        "Email updated successfully. Please check your inbox for verification instructions.",
    };
  } catch (error) {
    console.error("Update email error:", error);
    return {
      success: false,
      message:
        "An error occurred while updating your email. Please try again later.",
    };
  }
}

// Resend verification code
async function resendVerificationCode(formData: FormData) {
  const schema = z.object({
    email: z.string().email(),
  });

  const parse = schema.safeParse({
    email: formData.get("email"),
  });

  if (!parse.success) {
    return { success: false, message: "Invalid email format" };
  }

  try {
    const validatedData = emailSchema.parse({ email: parse.data.email });
    const normalizedEmail = validatedData.email.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "No user found with this email address",
      };
    }

    if (user.isVerified) {
      return {
        success: false,
        message: "This email is already verified",
      };
    }

    const verificationDetails = generateVerificationDetails();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verificationDetails.token,
        verificationPin: verificationDetails.pin,
        tokenExpiry: verificationDetails.tokenExpiry,
      },
    });

    const emailSent = await sendVerificationEmail(
      normalizedEmail,
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

// Verify email
async function verifyEmail(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const pin = formData.get("pin") as string;

    const validatedData = verifyPinSchema.safeParse({ email, pin });

    if (!validatedData.success) {
      return {
        success: false,
        message: "Invalid input",
      };
    }

    const normalizedEmail = validatedData.data.email.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        verificationPin: validatedData.data.pin,
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

    await prisma.user.update({
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
      redirect: "/signin",
    };
  } catch (error) {
    console.error("Verify email error:", error);
    return {
      success: false,
      message: "An error occurred. Please try again later.",
    };
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const action = formData.get("action") as string;

    switch (action) {
      case "updateEmail":
        return NextResponse.json(await updateEmail(formData));
      case "resendVerification":
        return NextResponse.json(await resendVerificationCode(formData));
      case "verifyEmail":
        return NextResponse.json(await verifyEmail(formData));
      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred. Please try again later." },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    jwt.verify(token, process.env.JWT_SECRET);
    // Allow access if token is valid
    return new NextResponse("Authenticated", { status: 200 });
  } catch (error) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
