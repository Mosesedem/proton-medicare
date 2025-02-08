import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { Resend } from "resend";
import { randomBytes } from "crypto";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schema for registration
const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]\d{1,14}$/, "Invalid phone number format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  // .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  // .regex(/[0-9]/, "Password must contain at least one number"),
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
        <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin-bottom: 20px;">Welcome to ProtonMedicare! ✨</h1>
            
            <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h2 style="color: #2c3e50;">Hey ${firstName}! 👋</h2>
                <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" 
                       style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify My Email
                    </a>
                </div>
                
                <p style="margin-top: 20px; color: #666;">This link will expire in 24 hours.</p>
                <p style="color: #666;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
            
            <div style="margin-top: 20px; text-align: center; color: #666; font-size: 14px;">
                <p>© ${new Date().getFullYear()} ProtonMedicare. All rights reserved.</p>
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
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${verificationToken}`;

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

// Main registration handler
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check for existing email (case-insensitive)
    const existingUser = await prisma.users.findUnique({
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
    const existingPhone = await prisma.users.findFirst({
      where: {
        phoneNumber: validatedData.phoneNumber,
      },
    });

    if (existingPhone) {
      return NextResponse.json(
        { success: false, message: "Phone number already registered" },
        { status: 400 },
      );
    }

    // Generate verification token
    const { token: verificationToken, expires: tokenExpiry } =
      generateVerificationToken();

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create user with verification token
    const user = await prisma.users.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email.toLowerCase(),
        phoneNumber: validatedData.phoneNumber,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
        tokenExpiry,
      },
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(
      user.email,
      user.firstName!,
      verificationToken,
    );

    // Return appropriate response based on email sending result
    return NextResponse.json({
      success: true,
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
  }
}
