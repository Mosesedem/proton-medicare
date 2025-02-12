import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schema for registration
const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(/^\+?[0-9]\d{1,14}$/, "Invalid phone number format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Type for registration data
type RegisterData = z.infer<typeof registerSchema>;

// Generate verification token
function generateVerificationToken(): { token: string; expires: Date } {
  const token = randomBytes(32).toString("hex");
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hour expiration
  return { token, expires };
}

// Email template
function getEmailTemplate(firstName: string, verificationLink: string) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email ✨</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #00897b;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #00897b;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ProtonMedicare! ✨</h1>
        </div>
        <div class="content">
            <h2 style="color: #2c3e50;">Hey ${firstName}! 👋</h2>
            <p>We're so excited to have you join our community! 🎉</p>
            <p>Just one more step to get started - please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="background-color: #12d8e0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify My Email
                </a>
            </div>
            <p>This link will expire in 24 hours ⏰</p>
            <p>If you didn't create an account, you can safely ignore this email 💌</p>
            <div class="footer">
                <p>Need help? Reply to this email or contact our support team 💪</p>
                <p>© ${new Date().getFullYear()} ProtonMedicare. All rights reserved.</p>
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
  verificationToken: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${encodeURIComponent(verificationToken)}&email=${encodeURIComponent(email)}`;

    const { data, error } = await resend.emails.send({
      from: "Proton Medicare <hq@hq.protonmedicare.com>",
      to: email,
      subject: "✨ Verify Your ProtonMedicare Account",
      html: getEmailTemplate(firstName, verificationLink),
    });

    if (error) {
      console.error("Email sending error:", error);
      return { success: false, error: "Failed to send verification email" };
    }

    console.log("Email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: "Failed to send verification email" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check for existing email (case-insensitive)
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedData.email.toLowerCase(),
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 },
      );
    }

    // Check for existing phone number
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone: validatedData.phone,
      },
    });

    if (existingPhone) {
      return NextResponse.json(
        { success: false, message: "Phone number already registered" },
        { status: 400 },
      );
    }

    // Generate verification token
    const { token: verificationToken } = generateVerificationToken();

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create user with verification token
    const user = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email.toLowerCase(),
        phone: validatedData.phone,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
        tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(
      user.email,
      user.firstName!,
      verificationToken,
    );

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    // Set the token as an httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Return appropriate response based on email sending result
    return NextResponse.json({
      success: true,
      token,
      message: emailResult.success
        ? "Account created successfully! Please check your email to verify your account."
        : "Account created successfully! There was an issue sending the verification email. Please contact support.",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("[Registration Error]:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.errors[0].message,
        },
        { status: 400 },
      );
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          success: false,
          message: "This email or phone number is already registered",
        },
        { status: 400 },
      );
    }

    // Handle all other errors
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during registration",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
