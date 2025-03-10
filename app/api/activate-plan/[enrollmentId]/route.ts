// app/api/activate-plan/[enrollmentId]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import https from "https";
import { plans } from "@/lib/constants";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

const PHP_LOGGING_ENDPOINT =
  process.env.PHP_LOGGING_ENDPOINT ||
  "https://seller.rest/debug/mycoverdebug.php";

const sendLogToPhp = async (logData: any) => {
  try {
    const logPayload = JSON.stringify({
      timestamp: new Date().toISOString(),
      service: "health-plan-activation",
      ...logData,
    });

    const url = new URL(PHP_LOGGING_ENDPOINT);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(logPayload),
        "X-API-Key":
          process.env.PHP_LOGGING_API_KEY ||
          "LOG_5b7363cc53914ddda99f45757052c36f",
      },
    };

    await new Promise<void>((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve();
        });
      });

      req.on("error", (error) => {
        console.error("Failed to send log to PHP endpoint:", error);
        reject(error);
      });

      req.write(logPayload);
      req.end();
    });
  } catch (error) {
    console.error("Failed to send log to PHP endpoint:", error);
  }
};

interface MyCoverResponse {
  reference_id?: string;
  success: boolean;
  message?: string;
}

const convertDateToStandard = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const httpsRequest = async <T>(
  url: string,
  method: string,
  data: any,
  headers: Record<string, string>,
): Promise<{ status: number; data: T }> => {
  const parsedUrl = new URL(url);

  const options: {
    hostname: string;
    port: string | number;
    path: string;
    method: string;
    headers: Record<string, string | number>;
  } = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443,
    path: parsedUrl.pathname + parsedUrl.search,
    method: method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  const payload = JSON.stringify(data);
  if (payload) {
    options.headers["Content-Length"] = Buffer.byteLength(payload);
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode || 500,
            data: parsedData as T,
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

const syncWithMyCoverAPI = async (
  enrollment: any,
): Promise<MyCoverResponse> => {
  if (!process.env.MYCOVER_API_KEY) {
    const error = new Error("MYCOVER_API_KEY is not configured");
    await sendLogToPhp({
      level: "ERROR",
      action: "syncWithMyCoverAPI",
      enrollmentId: enrollment.id,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }

  const formattedDateOfBirth = convertDateToStandard(enrollment.dateOfBirth);
  const selectedPlan = plans.find((plan) => plan.id === enrollment.planId);

  if (!selectedPlan) {
    const error = new Error(`Plan not found for ID: ${enrollment.planId}`);
    await sendLogToPhp({
      level: "ERROR",
      action: "syncWithMyCoverAPI",
      enrollmentId: enrollment.id,
      planId: enrollment.planId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }

  await sendLogToPhp({
    level: "INFO",
    action: "syncWithMyCoverAPI",
    enrollmentId: enrollment.id,
    planId: enrollment.planId,
    provider: selectedPlan.provider,
    message: "Selected plan found",
  });

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
        payment_plan: parseInt(enrollment.duration),
        product_id: enrollment.planId,
        meta: {
          enrollment_id: enrollment.id,
          user_id: enrollment.userId,
          user: { id: enrollment.userId },
        },
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
        payment_plan: parseInt(enrollment.duration),
        meta: {
          enrollment_id: enrollment.id,
          user_id: enrollment.userId,
          user: { id: enrollment.userId },
        },
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
        address: enrollment.address,
        image_url: enrollment.headshotUrl,
        payment_plan: parseInt(enrollment.duration),
        number_of_beneficiaries: enrollment.numberOfBeneficiaries,
        beneficiaries: enrollment.beneficiaries,
        product_id: enrollment.planId,
        meta: {
          enrollment_id: enrollment.id,
          user_id: enrollment.userId,
          user: { id: enrollment.userId },
        },
      };
      break;
    case "proton":
      apiUrl = "https://v2.protonmedicare.com/api/enroll/enroll.php";
      enrollmentData = {
        first_name: enrollment.firstName,
        last_name: enrollment.lastName,
        email: enrollment.email,
        phone_number: enrollment.phone,
        date_of_birth: formattedDateOfBirth,
        gender: enrollment.gender,
        address: enrollment.address,
        image_url: enrollment.headshotUrl,
        payment_plan: parseInt(enrollment.duration),
        number_of_beneficiaries: enrollment.numberOfBeneficiaries,
        beneficiaries: enrollment.beneficiaries,
        product_id: enrollment.planId,
      };
      break;
    default:
      const error = new Error(
        `Invalid plan provider: ${selectedPlan.provider}`,
      );
      await sendLogToPhp({
        level: "ERROR",
        action: "syncWithMyCoverAPI",
        enrollmentId: enrollment.id,
        provider: selectedPlan.provider,
        error: error.message,
        stack: error.stack,
      });
      throw error;
  }

  await sendLogToPhp({
    level: "INFO",
    action: "syncWithMyCoverAPI_request",
    enrollmentId: enrollment.id,
    provider: selectedPlan.provider,
    apiUrl: apiUrl,
    requestData: {
      ...enrollmentData,
      first_name: "[REDACTED]",
      last_name: "[REDACTED]",
      email: "[REDACTED]",
      phone: "[REDACTED]",
      phone_number: "[REDACTED]",
      image_url: "[REDACTED]",
      meta: enrollment.id,
    },
  });

  try {
    const response = await httpsRequest<MyCoverResponse>(
      apiUrl,
      "POST",
      enrollmentData,
      {
        Authorization: `Bearer ${process.env.MYCOVER_API_KEY}`,
      },
    );

    // Updated to accept both 200 and 201 status codes
    if (response.status !== 200 && response.status !== 201) {
      const error = new Error(`MyCover API returned status ${response.status}`);
      await sendLogToPhp({
        level: "ERROR",
        action: "syncWithMyCoverAPI_response",
        enrollmentId: enrollment.id,
        provider: selectedPlan.provider,
        apiUrl: apiUrl,
        status: response.status,
        error: error.message,
        response: response.data,
      });
      throw error;
    }

    await sendLogToPhp({
      level: "INFO",
      action: "syncWithMyCoverAPI_response",
      enrollmentId: enrollment.id,
      provider: selectedPlan.provider,
      status: response.status,
      success: response.data.success,
      referenceId: response.data.reference_id,
    });

    return response.data;
  } catch (error) {
    await sendLogToPhp({
      level: "ERROR",
      action: "syncWithMyCoverAPI_exception",
      enrollmentId: enrollment.id,
      provider: selectedPlan.provider,
      apiUrl: apiUrl,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      response:
        error instanceof Error && "response" in error
          ? (error as any).response?.data
          : null,
    });
    throw error;
  }
};

const calculatePlanDates = (enrollment: any) => {
  const startDate = new Date();
  const durationMonths = parseInt(enrollment.duration);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationMonths);
  const expirationDate = new Date(startDate);
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  const renewalDate = new Date(expirationDate);
  renewalDate.setMonth(renewalDate.getMonth() - 1);
  const activationDate = new Date(startDate);
  activationDate.setDate(activationDate.getDate() + 1);

  return {
    startDate,
    endDate,
    expirationDate,
    renewalDate,
    activationDate,
  };
};

const checkHealthPlanStatus = async (enrollmentId: number) => {
  try {
    const existingHealthPlan = await prisma.healthPlan.findFirst({
      where: { enrollmentId },
      select: {
        id: true,
        enrollmentId: true,
        status: true,
      },
    });

    if (!existingHealthPlan) {
      return { exists: false, status: null };
    }

    return {
      exists: true,
      status: existingHealthPlan.status,
      plan: existingHealthPlan,
    };
  } catch (error) {
    await sendLogToPhp({
      level: "ERROR",
      action: "checkHealthPlanStatus",
      enrollmentId: enrollmentId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    throw error;
  }
};

const createOrUpdateHealthPlan = async (enrollment: any) => {
  try {
    const dates = calculatePlanDates(enrollment);
    const selectedPlan = plans.find((plan) => plan.id === enrollment.planId);
    const hospitalListUrl = selectedPlan
      ? `/providers/${selectedPlan.provider}/hospitals.pdf`
      : "/providers/default/hospitals.pdf";

    const existingPlan = await prisma.healthPlan.findFirst({
      where: { enrollmentId: enrollment.id },
    });

    await sendLogToPhp({
      level: "INFO",
      action: "createOrUpdateHealthPlan_start",
      enrollmentId: enrollment.id,
      planExists: !!existingPlan,
      planId: enrollment.planId,
      provider: selectedPlan?.provider,
    });

    let result;

    if (existingPlan) {
      result = await prisma.healthPlan.update({
        where: { id: existingPlan.id },
        data: {
          status: "pending",
          startDate: dates.startDate,
          endDate: dates.endDate,
          expirationDate: dates.expirationDate,
          renewalDate: dates.renewalDate,
          activationDate: dates.activationDate,
          updatedAt: new Date(),
        },
      });

      await sendLogToPhp({
        level: "INFO",
        action: "createOrUpdateHealthPlan_update",
        enrollmentId: enrollment.id,
        planId: result.id,
        status: "pending",
      });
    } else {
      result = await prisma.healthPlan.create({
        data: {
          userId: enrollment.userId,
          enrollmentId: enrollment.id,
          firstName: enrollment.firstName,
          lastName: enrollment.lastName,
          email: enrollment.email,
          phone: enrollment.phone,
          planId: enrollment.planId,
          status: "pending",
          startDate: dates.startDate,
          endDate: dates.endDate,
          expirationDate: dates.expirationDate,
          renewalDate: dates.renewalDate,
          activationDate: dates.activationDate,
          imagePath: enrollment.headshotUrl || "",
          hospitalListUrl: hospitalListUrl,
        },
      });

      await sendLogToPhp({
        level: "INFO",
        action: "createOrUpdateHealthPlan_create",
        enrollmentId: enrollment.id,
        planId: result.id,
        status: "pending",
      });
    }

    return result;
  } catch (error) {
    await sendLogToPhp({
      level: "ERROR",
      action: "createOrUpdateHealthPlan",
      enrollmentId: enrollment.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    throw error;
  }
};

// Fixed POST handler with proper typing and params awaiting
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  const resolvedParams = await params; // Await the params promise
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 10)}`;

  await sendLogToPhp({
    level: "INFO",
    requestId: requestId,
    action: "activatePlan_request",
    enrollmentId: resolvedParams.enrollmentId,
    method: request.method,
    url: request.url,
  });

  try {
    const enrollmentId = parseInt(resolvedParams.enrollmentId);

    if (isNaN(enrollmentId)) {
      const error = "Invalid enrollment ID";
      await sendLogToPhp({
        level: "ERROR",
        requestId: requestId,
        action: "activatePlan_validation",
        enrollmentId: resolvedParams.enrollmentId,
        error: error,
      });
      return new Response(JSON.stringify({ error }), { status: 400 });
    }

    const healthPlanCheck = await checkHealthPlanStatus(enrollmentId);

    if (healthPlanCheck.exists) {
      if (healthPlanCheck.status === "active") {
        await sendLogToPhp({
          level: "WARN",
          requestId: requestId,
          action: "activatePlan_alreadyActive",
          enrollmentId: enrollmentId,
          healthPlanId: healthPlanCheck.plan?.id,
        });
        return NextResponse.json(
          {
            success: false,
            error: "Plan already activated",
            code: "ALREADY_ACTIVE",
            healthPlan: healthPlanCheck.plan,
          },
          { status: 409 },
        );
      } else if (healthPlanCheck.status === "pending") {
        await sendLogToPhp({
          level: "WARN",
          requestId: requestId,
          action: "activatePlan_pending",
          enrollmentId: enrollmentId,
          healthPlanId: healthPlanCheck.plan?.id,
        });
        return NextResponse.json(
          {
            success: false,
            error: "Plan activation in progress",
            code: "ACTIVATION_IN_PROGRESS",
            healthPlan: healthPlanCheck.plan,
          },
          { status: 202 },
        );
      }
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { user: { select: { id: true, gender: true, address: true } } },
    });

    await sendLogToPhp({
      level: "INFO",
      requestId: requestId,
      action: "activatePlan_enrollment",
      enrollmentId: enrollmentId,
      found: !!enrollment,
      status: enrollment?.status,
      paymentStatus: enrollment?.paymentStatus,
    });

    if (!enrollment) {
      await sendLogToPhp({
        level: "ERROR",
        requestId: requestId,
        action: "activatePlan_notFound",
        enrollmentId: enrollmentId,
      });
      return NextResponse.json(
        { success: false, error: "Enrollment not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (enrollment.status !== "active" || enrollment.paymentStatus !== "paid") {
      await sendLogToPhp({
        level: "ERROR",
        requestId: requestId,
        action: "activatePlan_invalidState",
        enrollmentId: enrollmentId,
        status: enrollment.status,
        paymentStatus: enrollment.paymentStatus,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Enrollment not eligible for activation",
          code: "INVALID_STATE",
          details: {
            status: enrollment.status,
            paymentStatus: enrollment.paymentStatus,
          },
        },
        { status: 400 },
      );
    }

    const healthPlan = await createOrUpdateHealthPlan(enrollment);

    let myCoverResponse: MyCoverResponse = { success: false };
    let syncError = null;

    try {
      myCoverResponse = await syncWithMyCoverAPI(enrollment);

      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          myCoverSyncStatus: "success",
          myCoverReferenceId: myCoverResponse.reference_id ?? null,
          status: "completed",
        },
      });

      await prisma.healthPlan.update({
        where: { id: healthPlan.id },
        data: { status: "active" },
      });

      await sendLogToPhp({
        level: "INFO",
        requestId: requestId,
        action: "activatePlan_success",
        enrollmentId: enrollmentId,
        healthPlanId: healthPlan.id,
        myCoverReferenceId: myCoverResponse.reference_id,
      });
    } catch (error) {
      syncError = error;
      await sendLogToPhp({
        level: "ERROR",
        requestId: requestId,
        action: "activatePlan_syncError",
        enrollmentId: enrollmentId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      });

      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          myCoverSyncStatus: "failed",
          myCoverSyncError:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      await prisma.healthPlan.update({
        where: { id: healthPlan.id },
        data: { status: "failed" },
      });
    }

    if (syncError) {
      const errorDetails =
        syncError instanceof Error
          ? { message: syncError.message, stack: syncError.stack }
          : { message: String(syncError) };

      await sendLogToPhp({
        level: "ERROR",
        requestId: requestId,
        action: "activatePlan_failureResponse",
        enrollmentId: enrollmentId,
        error: errorDetails.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Plan activation failed",
          code: "ACTIVATION_FAILED",
          details: errorDetails,
          healthPlan: healthPlan,
        },
        { status: 500 },
      );
    }

    await sendLogToPhp({
      level: "INFO",
      requestId: requestId,
      action: "activatePlan_successResponse",
      enrollmentId: enrollmentId,
      myCoverReferenceId: myCoverResponse.reference_id,
      healthPlanId: healthPlan.id,
    });

    return NextResponse.json({
      success: true,
      data: enrollment,
      myCoverReference: myCoverResponse.reference_id,
      healthPlan: healthPlan,
    });
  } catch (error) {
    await sendLogToPhp({
      level: "ERROR",
      requestId: requestId,
      action: "activatePlan_error",
      enrollmentId: resolvedParams.enrollmentId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });

    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { message: String(error) };

    return NextResponse.json(
      {
        success: false,
        error: "Plan activation failed",
        code: "ACTIVATION_FAILED",
        details: errorDetails,
      },
      { status: 500 },
    );
  } finally {
    await sendLogToPhp({
      level: "INFO",
      requestId: requestId,
      action: "activatePlan_complete",
      enrollmentId: resolvedParams.enrollmentId,
      timestamp: new Date().toISOString(),
    });
    await prisma.$disconnect();
  }
}
