import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createTransport } from "nodemailer";

const prisma = new PrismaClient();

const transporter = createTransport({
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: Request) {
  const { firstName, lastName, email, phoneNumber, password } =
    await request.json();

  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return NextResponse.json({
      success: false,
      message: "Invalid phone number format.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = Math.random().toString(36).substring(2, 15);
  const tokenExpiry = new Date();
  tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token expires in 24 hours

  const verificationLink = `${process.env.NEXTAUTH_URL}/verify?token=${verificationToken}`;

  const htmlContent = `
    <h1>Welcome to ProtonMedicare, ${firstName}!</h1>
    <p>Thank you for signing up. Please click the button below to verify your email address.</p>
    <a href="${verificationLink}" style="background-color:#4CAF50;border:none;color:white;padding:15px 32px;text-align:center;text-decoration:none;display:inline-block;font-size:16px;border-radius:5px;">Verify Email</a>
  `;

  try {
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
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({
      success: false,
      message:
        "An error occurred while creating your account. Please try again later.",
    });
  }

  try {
    await transporter.sendMail({
      from:
        process.env.SMTP_FROM || "ProtonMedicare <noreply@protonmedicare.com>",
      to: email,
      subject: "✨ Verify Your ProtonMedicare Account",
      html: htmlContent,
      text: `Hello ${firstName}, Please verify your account by visiting: ${verificationLink}`,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json({
      success: false,
      message:
        "Account created, but we couldn't send a verification email. Please contact support.",
    });
  }

  return NextResponse.json({
    success: true,
    message:
      "Account created successfully! Please check your email to verify your account.",
    redirect: "/dashboard/",
    user: {
      firstName,
      lastName,
      email,
      isVerified: false,
    },
  });
}
