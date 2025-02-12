import { NextResponse } from "next/server";
import { initializePaystack } from "@/lib/paystack";
import { PrismaClient } from "@prisma/client";
import { plans, durations } from "@/lib/constants";
import jwt from "jsonwebtoken";
import { writeFile } from "fs/promises";
import { join } from "path";

const prisma = new PrismaClient();

interface EnrollmentRequest {
  duration: string;
  plan: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  maritalStatus: string;
  referral: string;
  headshot?: File;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: Request) {
  try {
    // Get the JWT from the request headers
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    if (!decoded?.email) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    // Get the user from the database
    const user = await prisma.users.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Handle multipart form data for file upload
    const formData = await request.formData();
    const data: EnrollmentRequest = {
      duration: formData.get("duration") as string,
      plan: formData.get("plan") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      dob: formData.get("dob") as string,
      maritalStatus: formData.get("maritalStatus") as string,
      referral: formData.get("referral") as string,
    };

    // Get the headshot file if it exists
    const headshot = formData.get("headshot") as File | null;

    // Validate required fields
    const requiredFields = [
      "duration",
      "plan",
      "firstName",
      "lastName",
      "email",
      "phone",
      "dob",
      "maritalStatus",
      "headshot",
    ];
    for (const field of requiredFields) {
      if (!data[field as keyof EnrollmentRequest] && field !== "headshot") {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 },
        );
      }
    }

    if (!headshot) {
      return NextResponse.json(
        { success: false, error: "Headshot is required" },
        { status: 400 },
      );
    }

    // Handle file upload
    let headshotUrl = "";
    let headshotPath = "";
    if (headshot) {
      const bytes = await headshot.arrayBuffer();
      const buffer = Buffer.from(bytes);
      headshotPath = join(
        "public",
        "uploads",
        `${Date.now()}_${headshot.name}`,
      );
      await writeFile(headshotPath, buffer);
      headshotUrl = headshotPath.replace("public", "");
    }

    // Calculate price based on plan and duration using the same logic as frontend
    const selectedPlan = plans.find((p) => p.name === data.plan);
    const selectedDuration = durations.find((d) => d.value === data.duration);

    if (!selectedPlan || !selectedDuration) {
      return NextResponse.json(
        { success: false, error: "Invalid plan or duration" },
        { status: 400 },
      );
    }

    const basePrice = selectedPlan.basePrice;
    const duration = parseInt(data.duration);
    const discountedPrice = basePrice * (1 - selectedDuration.discount);
    const amount = discountedPrice * duration;

    // Save enrollment data using Prisma
    const enrollment = await prisma.enrollment.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: new Date(data.dob),
        maritalStatus: data.maritalStatus,
        referral: data.referral,
        plan: data.plan,
        duration: String(duration),
        amount: amount,
        paymentStatus: "PENDING",
        headshotUrl,
        headshotPath,
        userId: user.id, // Link to the authenticated user
      },
    });

    // Initialize Paystack payment
    const paystack = initializePaystack();
    const response = await paystack.transaction.initialize({
      email: data.email,
      amount: amount * 100, // Convert to kobo
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-payment`,
      metadata: {
        enrollmentId: enrollment.id,
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        plan: data.plan,
        duration: data.duration,
      },
    });

    return NextResponse.json({
      success: true,
      paymentUrl: response.data.authorization_url,
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { success: false, error: "Enrollment failed" },
      { status: 500 },
    );
  }
}
