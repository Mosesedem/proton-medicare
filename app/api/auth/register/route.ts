/* eslint-disable @typescript-eslint/no-unused-vars */
import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schema
const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .trim(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").trim(),
  email: z.string().email("Invalid email format").toLowerCase(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

type RegisterData = z.infer<typeof registerSchema>;

function generateVerificationToken(): { token: string; expires: Date } {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { token, expires };
}

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
        .emoji {
            font-size: 24px;
            margin: 0 5px;
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
                    <a href="${verificationLink}" 
                       style="background-color: #12d8e0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify My Email
                    </a>
                </div>
            
            <p>This link will expire in 24 hours ⏰</p>
            
            <p>If you didn't create an account, you can safely ignore this email 💌</p>
            
            <div class="footer">
                <p>Need help? Reply to this email or contact our support team 💪</p>
            <div style="margin-top: 20px; text-align: center; color: #666; font-size: 14px;">
                <p>© ${new Date().getFullYear()} ProtonMedicare. All rights reserved.</p>
            </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

async function sendVerificationEmail(
  email: string,
  firstName: string,
  verificationToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error("NEXT_PUBLIC_APP_URL is not configured");
    }

    const verificationLink = `${
      process.env.NEXT_PUBLIC_APP_URL
    }/verify?token=${encodeURIComponent(
      verificationToken
    )}&email=${encodeURIComponent(email)}`;

    const { error } = await resend.emails.send({
      from: "Proton Medicare <hq@hq.protonmedicare.com>",
      to: email,
      subject: "✨ Verify Your ProtonMedicare Account",
      html: getEmailTemplate(firstName, verificationLink),
    });

    if (error) {
      console.error("Email sending error:", error);
      return { success: false, error: "Failed to send verification email" };
    }

    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: "Failed to send verification email" };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check for existing users (transaction for atomicity)
    const [existingEmail, existingPhone] = await prisma.$transaction([
      prisma.user.findUnique({ where: { email: validatedData.email } }),
      prisma.user.findFirst({
        where: { phoneNumber: validatedData.phoneNumber },
      }),
    ]);

    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }
    if (existingPhone) {
      return NextResponse.json(
        { success: false, message: "Phone number already registered" },
        { status: 400 }
      );
    }

    // Generate verification token and hash password
    const { token: verificationToken, expires: tokenExpiry } =
      generateVerificationToken();
    const hashedPassword = await hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
        tokenExpiry,
        role: "USER", // Default role
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "strict" as const,
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(
      user.email,
      user.firstName!,
      verificationToken
    );

    return NextResponse.json({
      success: true,
      token,
      message: emailResult.success
        ? "Registration successful! Please check your email to verify your account."
        : "Registration successful, but failed to send verification email. Please contact support.",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[Registration Error]:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            success: false,
            message: "Email or phone number already registered",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
