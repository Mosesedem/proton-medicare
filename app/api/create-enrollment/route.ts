// app/api/create-enrollment/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { plans, durations } from "@/lib/constants";
import jwt from "jsonwebtoken";
import { writeFile } from "fs/promises";
import { join } from "path";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "Authorization header missing" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token missing" },
        { status: 401 },
      );
    }

    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || "") as { id: number };
      if (!user || !user.id) {
        return NextResponse.json(
          { success: false, message: "Invalid token payload" },
          { status: 401 },
        );
      }
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    const formData = await request.formData();

    // Extract data from formData
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const dob = formData.get("dob") as string;
    const maritalStatus = formData.get("maritalStatus") as string;
    const plan = formData.get("plan") as string;
    const duration = formData.get("duration") as string;
    const referral = formData.get("referral") as string;
    const planId = formData.get("planId") as string;
    const headshot = formData.get("headshot") as File;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !dob ||
      !maritalStatus ||
      !plan ||
      !duration ||
      !headshot ||
      !planId
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Handle file upload
    // Upload headshot to PHP API
    let headshotUrl = "";
    const uploadUrl = process.env.PHP_UPLOAD_ENDPOINT; // Change this to your PHP upload URL
    if (!uploadUrl) {
      return NextResponse.json(
        { success: false, message: "Could not upload image" },
        { status: 500 },
      );
    }
    const uploadFormData = new FormData();
    uploadFormData.append("file", headshot);

    try {
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: uploadFormData,
      });

      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success) {
        return NextResponse.json(
          {
            success: false,
            message: "File upload failed",
            error: uploadResult.error,
          },
          { status: 500 },
        );
      }

      headshotUrl = uploadResult.imageUrl;
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Error uploading file",
          error: String(error),
        },
        { status: 500 },
      );
    }

    //Plan and duration validation
    const planData = plans.find((p) => p.name === plan);
    const planIdData = plans.find((p) => p.id === planId);
    const durationData = durations.find((d) => d.value === duration);

    if (!planData || !durationData) {
      return NextResponse.json(
        { success: false, message: "Invalid plan or duration" },
        { status: 400 },
      );
    }

    const amount = planData.basePrice * (1 - durationData.discount);

    const data = {
      firstName,
      lastName,
      email,
      phone,
      dob,
      maritalStatus,
      plan,
      duration,
      referral,
      planId,
    };

    // Log the data before creating the enrollment
    console.log("Attempting to create enrollment with data:", {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: new Date(data.dob),
      maritalStatus: data.maritalStatus,
      referral: data.referral,
      plan: data.plan,
      planId: data.planId,
      duration: String(duration),
      amount: amount,
      paymentStatus: "PENDING",
      headshotUrl,
      headshotPath: headshotUrl,
      userId: user.id,
      status: "PENDING",
      lastPaymentDate: new Date(),
    });

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
        planId: data.planId,
        duration: String(duration),
        amount: amount,
        paymentStatus: "PENDING",
        headshotUrl,
        headshotPath: headshotUrl,
        userId: user.id,
        status: "PENDING", // Added this field
        lastPaymentDate: new Date(), // Added this field
        lastPaymentError: null,
        myCoverSyncStatus: null,
        myCoverReferenceId: null,
        myCoverSyncError: null,
        beneficiaries: [],
        numberOfBeneficiaries: 0,
        gender: "female", // Adding required field with default value
        address: "Not provided", // Adding required field with default value
      },
    });

    console.log("Enrollment created successfully:", enrollment);

    return NextResponse.json({
      success: true,
      message: "Enrollment created successfully",
      enrollment_id: enrollment.id,
    });
  } catch (error) {
    console.error("Detailed enrollment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Enrollment failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
