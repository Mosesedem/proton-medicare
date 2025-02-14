import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Verify Paystack webhook signature
const verifySignature = (request: Request, body: string) => {
  const signature = request.headers.get("x-paystack-signature");
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");
  return hash === signature;
};

export async function POST(request: Request) {
  try {
    // Get the raw body as string
    const body = await request.text();

    // Verify webhook signature
    if (!verifySignature(request, body)) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 },
      );
    }

    const payload = JSON.parse(body);
    const { event, data } = payload;

    // Handle both successful and failed charges
    if (event === "charge.success" || event === "charge.failed") {
      // Extract enrollment ID from metadata
      const enrollmentId = parseInt(data.metadata.enrollment_id);

      // Get the enrollment to find the userId
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        select: { userId: true },
      });

      if (!enrollment) {
        throw new Error(`Enrollment not found for ID: ${enrollmentId}`);
      }

      // Create payment record with flattened structure
      await prisma.payment.create({
        data: {
          paystackId: data.id.toString(),
          reference: data.reference,
          amount: data.amount / 100, // Convert from kobo to naira
          currency: data.currency,
          status: data.status,
          channel: data.channel,
          paidAt: event === "charge.success" ? new Date(data.paid_at) : null,
          createdAt: new Date(data.created_at),
          userId: enrollment.userId,
          enrollmentId: enrollmentId,

          // Error details (for failed transactions)
          errorMessage: data.message || null,
          gatewayResponse: data.gateway_response || null,

          // Metadata fields
          plan: data.metadata.plan,
          planCode: data.metadata.plan_code,
          isSubscription: data.metadata.is_subscription === "true",
          enrollmentMetadataId: data.metadata.enrollment_id,

          // Customer fields
          customerEmail: data.customer.email,
          customerName:
            `${data.customer.first_name} ${data.customer.last_name}`.trim(),
          customerCode: data.customer.customer_code,
          customerPhone: data.customer.phone || null,

          // Authorization fields (may be null for failed transactions)
          authorizationCode: data.authorization?.authorization_code || null,
          cardBin: data.authorization?.bin || null,
          cardLast4: data.authorization?.last4 || null,
          cardExpMonth: data.authorization?.exp_month || null,
          cardExpYear: data.authorization?.exp_year || null,
          cardType: data.authorization?.card_type || null,
          cardBank: data.authorization?.bank || null,
          cardCountryCode: data.authorization?.country_code || null,
          cardBrand: data.authorization?.brand || null,
          cardReusable: data.authorization?.reusable || false,
          cardSignature: data.authorization?.signature || null,
          cardAccountName: data.authorization?.account_name || null,
          cardReceiverBankAccountNumber:
            data.authorization?.receiver_bank_account_number || null,
          cardReceiverBank: data.authorization?.receiver_bank || null,
        },
      });

      // Update enrollment status based on transaction result
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: event === "charge.success" ? "completed" : "payment_failed",
          paymentStatus: event === "charge.success" ? "paid" : "failed",
          lastPaymentDate:
            event === "charge.success" ? new Date(data.paid_at) : undefined,
          lastPaymentError:
            event === "charge.failed" ? data.gateway_response : null,
        },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
