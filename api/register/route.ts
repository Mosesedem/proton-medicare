import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import { getVerificationEmailTemplate } from "@/emails/verification";

const prisma = new PrismaClient();

// Initialize nodemailer transporter outside the handler
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, phoneNumber, password } =
      await req.json();

    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      return NextResponse.json({
        success: false,
        message: "All fields are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: "Invalid email address.",
      });
    }

    if (
      password.length < 6 ||
      !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password)
    ) {
      return NextResponse.json({
        success: false,
        message:
          "Password must be at least 6 characters long and include both letters and numbers.",
      });
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.users.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        password: hashedPassword,
        verificationToken,
        tokenExpiry,
      },
    });

    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${verificationToken}`;
    const htmlContent = getVerificationEmailTemplate(
      firstName,
      verificationLink,
    );

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM || "ProtonMedicare <noreply@protonmedicare.com>",
      to: email,
      subject: "✨ Verify Your ProtonMedicare Account",
      html: htmlContent,
      text: `Hello ${firstName}, Please verify your account by visiting: ${verificationLink}`,
    });

    return NextResponse.json({
      success: true,
      message:
        "Account created successfully! Please check your email to verify your account.",
      redirect: "/dashboard/",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({
      success: false,
      message: "An error occurred during registration. Please try again later.",
    });
  } finally {
    await prisma.$disconnect();
  }
}
