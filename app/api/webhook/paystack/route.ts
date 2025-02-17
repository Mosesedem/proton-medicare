import { NextResponse } from "next/server";
import { PrismaClient, Enrollment, User } from "@prisma/client";
import crypto from "crypto";
import axios from "axios";
import { plans } from "@/lib/constants";

const prisma = new PrismaClient();
const DEBUG_LOG_URL = "https://seller.rest/debug/debug.php";

// Enhanced debug logging function
const sendDebugLog = async (
  headers: Headers,
  body: string | object,
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
      body: typeof body === "string" ? JSON.parse(body) : body,
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

// Existing interfaces remain the same
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

// Enhanced verification with logging
const verifySignature = async (
  request: Request,
  body: string,
): Promise<boolean> => {
  const signature = request.headers.get("x-paystack-signature");
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) {
    await sendDebugLog(
      request.headers,
      { error: "Missing signature or secret key" },
      "signature_verification_failed",
    );
    return false;
  }
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");

  const isValid = hash === signature;
  await sendDebugLog(
    request.headers,
    { calculated_hash: hash, received_signature: signature },
    "signature_verification_result",
    { isValid },
  );
  return isValid;
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

// Enhanced MyCover sync with logging
const syncWithMyCoverAPI = async (
  enrollment: EnrichedEnrollment,
  headers: Headers,
): Promise<MyCoverResponse> => {
  await sendDebugLog(headers, enrollment, "mycover_sync_started");

  if (!process.env.MYCOVER_API_KEY) {
    throw new Error("MYCOVER_API_KEY is not configured");
  }

  const convertDateToStandard = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formattedDateOfBirth = convertDateToStandard(enrollment.dateOfBirth);

  const selectedPlan = planIdData.find((plan) => plan.id === enrollment.planId);
  if (!selectedPlan) {
    await sendDebugLog(
      headers,
      { error: `Plan not found: ${enrollment.planId}` },
      "mycover_sync_plan_error",
    );
    throw new Error(`Plan not found for ID: ${enrollment.planId}`);
  }

  let apiUrl = "";
  let enrollmentData = {};

  switch (selectedPlan.provider) {
    case "bastion":
      apiUrl = "https://api.mycover.ai/v1/products/bastion/buy-health";
      enrollmentData = {
        first_name: enrollment.firstName,
        last_name: enrollment.lastName,
        email: enrollment.email,
        phone_number: enrollment.phone,
        gender: enrollment.gender,
        marital_status: enrollment.maritalStatus,
        image_url: enrollment.headshotUrl,
        date_of_birth: formattedDateOfBirth,
        payment_plan: 1,
        product_id: enrollment.planId,
      };
      break;
    case "hygeia":
      apiUrl = "https://api.mycover.ai/v1/products/mcg/buy-flexi-care";
      enrollmentData = {
        first_name: enrollment.firstName,
        last_name: enrollment.lastName,
        email: enrollment.email,
        phone: enrollment.phone,
        gender: enrollment.gender,
        dob: formattedDateOfBirth,
        image_url: enrollment.headshotUrl,
        product_id: enrollment.planId,
        payment_plan: 1,
      };
      break;
    case "wella":
      apiUrl = "https://api.mycover.ai/v1/products/wella/buy-health-malaria";
      enrollmentData = {
        first_name: enrollment.firstName,
        last_name: enrollment.lastName,
        email: enrollment.email,
        phone_number: enrollment.phone,
        date_of_birth: formattedDateOfBirth,
        gender: enrollment.gender,
        address: enrollment.user.address,
        image_url: enrollment.headshotUrl,
        payment_plan: 1,
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
        date_of_birth: formattedDateOfBirth,
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
    await sendDebugLog(
      headers,
      { url: apiUrl, data: enrollmentData },
      "mycover_api_request",
    );

    const response = await axios.post<MyCoverResponse>(apiUrl, enrollmentData, {
      headers: {
        Authorization: `Bearer ${process.env.MYCOVER_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    await sendDebugLog(headers, response.data, "mycover_api_response");

    if (response.status !== 200) {
      throw new Error(`MyCover API returned status ${response.status}`);
    }

    return response.data;
  } catch (error) {
    await sendDebugLog(headers, { error }, "mycover_api_error");
    throw error;
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.text();
    await sendDebugLog(request.headers, body, "request_received");

    const isSignatureValid = await verifySignature(request, body);
    if (!isSignatureValid) {
      await sendDebugLog(request.headers, body, "invalid_signature");
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
    await sendDebugLog(request.headers, { event, data }, "payload_parsed");

    if (event !== "charge.success" && event !== "charge.failed") {
      await sendDebugLog(request.headers, { event }, "event_ignored");
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

    await sendDebugLog(
      request.headers,
      { enrollmentId, found: !!enrollment },
      "enrollment_lookup",
    );

    if (!enrollment) {
      await sendDebugLog(
        request.headers,
        { error: `Enrollment not found: ${enrollmentId}` },
        "enrollment_not_found",
      );
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

    await sendDebugLog(request.headers, { payment }, "payment_created");

    // Update enrollment
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

    await sendDebugLog(
      request.headers,
      { updatedEnrollment },
      "enrollment_updated",
    );

    if (event === "charge.success") {
      try {
        const myCoverResponse = await syncWithMyCoverAPI(
          enrollment,
          request.headers,
        );

        const syncedEnrollment = await prisma.enrollment.update({
          where: { id: enrollmentId },
          data: {
            myCoverSyncStatus: "success",
            myCoverReferenceId: myCoverResponse.reference_id ?? null,
          },
        });

        await sendDebugLog(
          request.headers,
          { myCoverResponse, syncedEnrollment },
          "mycover_sync_success",
        );
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

        await sendDebugLog(
          request.headers,
          { error: syncError, failedSync },
          "mycover_sync_failed",
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    await sendDebugLog(request.headers, { error }, "webhook_error");
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
