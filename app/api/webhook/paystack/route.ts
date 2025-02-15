import { NextResponse } from "next/server";
import { PrismaClient, Enrollment, User } from "@prisma/client";
import crypto from "crypto";
import axios from "axios";
import { plans } from "@/lib/constants";
import { map } from "zod";

const prisma = new PrismaClient();

const DEBUG_LOG_URL = "https://v2.protonmedicare.com/debug/debug.php";

const sendDebugLog = async (
  headers: Headers,
  body: string,
  stage: string,
  details?: any,
) => {
  try {
    const logData = {
      timestamp: new Date().toISOString(),
      stage,
      headers: {
        "x-forwarded-for": headers.get("x-forwarded-for") || "",
        "user-agent": headers.get("user-agent") || "",
        "x-paystack-signature": headers.get("x-paystack-signature") || "",
      },
      body: JSON.parse(body),
      details,
    };

    await axios.post(DEBUG_LOG_URL, JSON.stringify(logData), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to send debug log:", error);
  }
};

// Define interfaces for better type safety
interface PaystackWebhookData {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  channel: string;
  paid_at?: string;
  created_at: string;
  message?: string;
  gateway_response?: string;
  authorization?: {
    authorization_code?: string;
    bin?: string;
    last4?: string;
    exp_month?: string;
    exp_year?: string;
    card_type?: string;
    bank?: string;
    country_code?: string;
    brand?: string;
    reusable?: boolean;
    signature?: string;
    account_name?: string;
    receiver_bank_account_number?: string;
    receiver_bank?: string;
  };
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    customer_code: string;
    phone?: string;
  };
  metadata: {
    enrollment_id: string;
    plan: string;
    plan_code: string;
    is_subscription: string;
  };
}

interface MyCoverResponse {
  reference_id?: string;
  success: boolean;
  message?: string;
}

interface EnrichedEnrollment extends Enrollment {
  user: Pick<User, "id" | "gender" | "address">;
}

// Verify Paystack webhook signature
const verifySignature = (request: Request, body: string): boolean => {
  const signature = request.headers.get("x-paystack-signature");
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) {
    return false;
  }
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");
  return hash === signature;
};

const planIdData = plans.map((plan) => {
  return {
    id: plan.id,
    name: plan.name,
    type: plan.type,
    provider: plan.provider,
    basePrice: plan.basePrice,
    description: plan.description,
    features: plan.features,
    additionalBenefits: plan.additionalBenefits,
  };
});
// Function to sync enrollment data with MyCover API
const syncWithMyCoverAPI = async (
  enrollment: EnrichedEnrollment,
): Promise<MyCoverResponse> => {
  if (!process.env.MYCOVER_API_KEY) {
    throw new Error("MYCOVER_API_KEY is not configured");
  }

  let apiUrl = "";
  let enrollmentData = {};

  const selectedPlan = planIdData.find((plan) => plan.id === enrollment.planId);
  if (!selectedPlan)
    throw new Error(`Plan not found for ID: ${enrollment.planId}`);

  switch (selectedPlan.provider) {
    case "bastion":
      apiUrl = "https://api.mycover.ai/products/health/bastion/enroll";
      enrollmentData = {
        first_name: enrollment.firstName,
        last_name: enrollment.lastName,
        email: enrollment.email,
        phone_number: enrollment.phone,
        gender: enrollment.user.gender,
        marital_status: enrollment.maritalStatus,
        image_url: enrollment.headshotUrl,
        date_of_birth: enrollment.dateOfBirth,
        payment_plan: enrollment.duration,
        product_id: enrollment.planId,
      };
      break;
    case "hygeia":
      apiUrl = "https://api.mycover.ai/products/health/hygeia/enroll";
      enrollmentData = {
        first_name: enrollment.firstName,
        last_name: enrollment.lastName,
        email: enrollment.email,
        phone: enrollment.phone,
        gender: enrollment.user.gender,
        dob: enrollment.dateOfBirth,
        image_url: enrollment.headshotUrl,
        product_id: enrollment.planId,
      };
      break;
    case "wella":
      apiUrl = "https://api.mycover.ai/products/health/malaria/enroll";
      enrollmentData = {
        first_name: enrollment.firstName,
        last_name: enrollment.lastName,
        email: enrollment.email,
        phone_number: enrollment.phone,
        date_of_birth: enrollment.dateOfBirth,
        gender: enrollment.user.gender,
        address: enrollment.user.address,
        image_url: enrollment.headshotUrl,
        payment_plan: enrollment.duration,
        number_of_beneficiaries: enrollment.numberOfBeneficiaries,
        beneficiaries: enrollment.beneficiaries,
        product_id: enrollment.planId,
      };
      break;
    case "proton":
      apiUrl = "";
      enrollmentData = {
        first_name: enrollment.firstName,
        last_name: enrollment.lastName,
        email: enrollment.email,
        phone_number: enrollment.phone,
        date_of_birth: enrollment.dateOfBirth,
        gender: enrollment.user.gender,
        address: enrollment.user.address,
        image_url: enrollment.headshotUrl,
        payment_plan: enrollment.duration,
        number_of_beneficiaries: enrollment.numberOfBeneficiaries,
        beneficiaries: enrollment.beneficiaries,
        product_id: enrollment.planId,
      };
      break;
    default:
      throw new Error(`Invalid plan selection: ${selectedPlan.provider}`);
  }

  try {
    const response = await axios.post<MyCoverResponse>(apiUrl, enrollmentData, {
      headers: {
        Authorization: `Bearer ${process.env.MYCOVER_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      throw new Error(`MyCover API returned status ${response.status}`);
    }

    return response.data;
  } catch (error) {
    // Type guard for axios error
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
        message: string;
      };
      throw new Error(
        `MyCover API sync failed: ${axiosError.response?.data?.message || axiosError.message}`,
      );
    }
    throw new Error("MyCover API sync failed: Unknown error occurred");
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.text();

    // Log initial request
    await sendDebugLog(request.headers, body, "request_received");

    // Verify signature and log result
    const isSignatureValid = verifySignature(request, body);
    await sendDebugLog(request.headers, body, "signature_verification", {
      isValid: isSignatureValid,
    });

    if (!isSignatureValid) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 },
      );
    }

    const payload = JSON.parse(body);
    const { event, data } = payload as {
      event: string;
      data: PaystackWebhookData;
    };

    // Log parsed payload
    await sendDebugLog(request.headers, body, "payload_parsed", {
      event,
      data,
    });

    if (event !== "charge.success" && event !== "charge.failed") {
      await sendDebugLog(request.headers, body, "event_ignored", {
        reason: "Not a relevant event",
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const enrollmentId = parseInt(data.metadata.enrollment_id);

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: {
          select: {
            id: true,
            gender: true,
            address: true,
          },
        },
      },
    });

    // Log enrollment lookup
    await sendDebugLog(request.headers, body, "enrollment_lookup", {
      enrollmentId,
      found: !!enrollment,
    });

    if (!enrollment) {
      throw new Error(`Enrollment not found for ID: ${enrollmentId}`);
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        paystackId: data.id.toString(),
        reference: data.reference,
        amount: data.amount / 100,
        currency: data.currency,
        status: data.status,
        channel: data.channel,
        paidAt:
          event === "charge.success" && data.paid_at
            ? new Date(data.paid_at)
            : null,
        createdAt: new Date(data.created_at),
        userId: enrollment.userId,
        enrollmentId,
        errorMessage: data.message,
        gatewayResponse: data.gateway_response,
        plan: data.metadata.plan,
        planCode: data.metadata.plan_code,
        isSubscription: data.metadata.is_subscription === "true",
        enrollmentMetadataId: data.metadata.enrollment_id,
        customerEmail: data.customer.email,
        customerName:
          `${data.customer.first_name} ${data.customer.last_name}`.trim(),
        customerCode: data.customer.customer_code,
        customerPhone: data.customer.phone,
        authorizationCode: data.authorization?.authorization_code,
        cardBin: data.authorization?.bin,
        cardLast4: data.authorization?.last4,
        cardExpMonth: data.authorization?.exp_month,
        cardExpYear: data.authorization?.exp_year,
        cardType: data.authorization?.card_type,
        cardBank: data.authorization?.bank,
        cardCountryCode: data.authorization?.country_code,
        cardBrand: data.authorization?.brand,
        cardReusable: data.authorization?.reusable ?? false,
        cardSignature: data.authorization?.signature,
        cardAccountName: data.authorization?.account_name,
        cardReceiverBankAccountNumber:
          data.authorization?.receiver_bank_account_number,
        cardReceiverBank: data.authorization?.receiver_bank,
      },
    });

    // Log payment creation
    await sendDebugLog(request.headers, body, "payment_created", { payment });

    // Update enrollment status
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: event === "charge.success" ? "completed" : "payment_failed",
        paymentStatus: event === "charge.success" ? "paid" : "failed",
        lastPaymentDate:
          event === "charge.success" && data.paid_at
            ? new Date(data.paid_at)
            : undefined,
        lastPaymentError:
          event === "charge.failed" ? data.gateway_response : null,
      },
    });

    // Log enrollment update
    await sendDebugLog(request.headers, body, "enrollment_updated", {
      updatedEnrollment,
    });

    if (event === "charge.success") {
      try {
        const myCoverResponse = await syncWithMyCoverAPI(enrollment);

        const syncedEnrollment = await prisma.enrollment.update({
          where: { id: enrollmentId },
          data: {
            myCoverSyncStatus: "success",
            myCoverReferenceId: myCoverResponse.reference_id ?? null,
          },
        });

        // Log successful MyCover sync
        await sendDebugLog(request.headers, body, "mycover_sync_success", {
          myCoverResponse,
          syncedEnrollment,
        });
      } catch (syncError) {
        console.error("MyCover API sync failed:", syncError);
        const failedSync = await prisma.enrollment.update({
          where: { id: enrollmentId },
          data: {
            myCoverSyncStatus: "failed",
            myCoverSyncError:
              syncError instanceof Error
                ? syncError.message
                : "Unknown error occurred",
          },
        });

        // Log failed MyCover sync
        await sendDebugLog(request.headers, body, "mycover_sync_failed", {
          error: syncError,
          failedSync,
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Log any errors
    await sendDebugLog(request.headers, "error", "webhook_error", { error });
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
