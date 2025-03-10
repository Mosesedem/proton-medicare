// app/api/create-enrollment/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { plans, durations } from "@/lib/constants";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Get user from session using requireAuth
    const user = await requireAuth();

    // If requireAuth fails to return a user, it should throw an error
    // But let's add an explicit check just in case
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
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
    const gender = formData.get("gender") as string;
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
      !gender ||
      !plan ||
      !duration ||
      !headshot ||
      !planId
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Handle file upload to PHP API
    let headshotUrl = "";
    const uploadUrl = process.env.PHP_UPLOAD_ENDPOINT;
    if (!uploadUrl) {
      return NextResponse.json(
        { success: false, message: "Could not upload image" },
        { status: 500 }
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
          { status: 500 }
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
        { status: 500 }
      );
    }

    // Plan and duration validation
    const planData = plans.find((p) => p.name === plan);
    const durationData = durations.find((d) => d.value === duration);

    if (!planData || !durationData) {
      return NextResponse.json(
        { success: false, message: "Invalid plan or duration" },
        { status: 400 }
      );
    }

    const amount = planData.basePrice * (1 - durationData.discount);

    const convertDateToStandard = (date: Date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const formattedDateOfBirth = convertDateToStandard(new Date(dob));

    // Log the data before creating the enrollment
    console.log("Attempting to create enrollment with data:", {
      userId: user.id,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: formattedDateOfBirth,
      maritalStatus,
      gender,
      referral,
      plan,
      planId,
      duration,
      amount,
      paymentStatus: "PENDING",
      headshotUrl,
      headshotPath: headshotUrl,
      status: "PENDING",
      lastPaymentDate: new Date(),
    });

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id, // Using user ID from session
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: new Date(dob),
        maritalStatus,
        gender,
        referral: referral || null,
        plan,
        planId,
        duration: String(duration),
        amount,
        paymentStatus: "PENDING",
        headshotUrl,
        headshotPath: headshotUrl,
        status: "PENDING",
        lastPaymentDate: new Date(),
        lastPaymentError: null,
        myCoverSyncStatus: null,
        myCoverReferenceId: null,
        myCoverSyncError: null,
        beneficiaries: [],
        numberOfBeneficiaries: 0,
        address: "Not provided",
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
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
