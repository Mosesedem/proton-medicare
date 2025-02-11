import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Schema validation
const emailSchema = z.object({ email: z.string().email() });
const pinSchema = z.object({
  email: z.string().email(),
  pin: z.string().length(6),
});
const resetSchema = z.object({
  email: z.string().email(),
  pin: z.string().length(6),
  new_password: z.string().min(6),
});

// Generate a 6-digit PIN
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send Reset PIN Email
async function sendResetEmail(
  email: string,
  pin: string,
  firstName: string,
  resetPinExpiry: string,
) {
  try {
    await resend.emails.send({
      from: "Proton Medicare <hq@hq.protonmedicare.com>",
      to: email,
      subject: "Password Reset Code",
      html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password ✨</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f9f9fa;
        }
        .header {
            background-color: #00897b;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #00897b;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .emoji {
            font-size: 24px;
            margin: 0 5px;
        }
        .pin-box {
            font-size: 20px;
            font-weight: bold;
            color: #00897b;
            text-align: center;
            background-color: #f9f9f9;
            padding: 10px 15px;
            border: 1px dashed #00897b;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 14px;
        }
                    .p a {
            color: #009C9D;
            text-decoration: none;
            font-weight: 600;
        }

        .p a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your ProtonMedicare Password 🔐</h1>
        </div>
        <div class="content">
<h2 style="color: #2c3e50;">Hey ${firstName}! 👋</h2>
            <p>You've requested to reset your password for ProtonMedicare. Here's your reset PIN:</p>
            
            <div class="pin-box">
                ${pin}
            </div>
            
            <p>Use this PIN to reset your password. It will expire in <strong>${resetPinExpiry}</strong>.</p>
            
            <p>If you didn't request this reset, please ignore this email or <a href="mailto:support@protonmedicare.com">contact support</a> immediately.</p>

            <div class="footer">
                <p>Need help? Reply to this email or contact our support team 💪</p>
          <div style="margin-top: 20px; text-align: center; color: #666; font-size: 14px;">
                <p>© ${new Date().getFullYear()} ProtonMedicare. All rights reserved.</p>
            </div>
            </div>
        </div>
    </div>
</body>
</html>`,
    });
  } catch (error) {
    console.error("Error sending reset email:", error);
    throw new Error("Failed to send reset PIN. Please try again later.");
  }
}

// Send Password Reset Confirmation Email
async function sendConfirmationEmail(email: string, firstName: string) {
  try {
    await resend.emails.send({
      from: "Proton Medicare <hq@hq.protonmedicare.com>",
      to: email,
      subject: "Password Reset Successful",
      html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Successful</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', Arial, sans-serif;
            background: #F0F4F8;
            color: #333;
        }

        .container {
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
        }

        .card {
            background: #F8F9FA;;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            padding: 40px;
            text-align: center;
        }

        .card h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 16px;
            color: #009C9D;
        }

        .card p {
            font-size: 16px;
            line-height: 1.6;
            color: #555;
            margin-bottom: 24px;
        }

        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #009C9D, #00B3B4);
            font-size: 16px;
            font-weight: 600;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 18px rgba(0, 156, 157, 0.3);
        }

        .footer {
            font-size: 14px;
            color: #888;
            margin-top: 32px;
            border-top: 1px solid #E0E6ED;
            padding-top: 20px;
        }

        .footer a {
            color: #009C9D;
            text-decoration: none;
            font-weight: 600;
        }

        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Password Reset Successful</h1>
<h2 style="color: #2c3e50;">Hey ${firstName}! 👋</h2>
            <p>Your password for <strong>Proton Medicare</strong> has been successfully reset.</p>

            <p>You can now log in to your account using your new password:</p>

<a href="https://protonmedicare.com/signin" class="cta-button" style="color:#ffffff;">Login to Your Account</a>
            <p>If you did not make this change, please contact our support team immediately.</p>

            <div class="footer">
                <p>Need help? Contact us at <a href="mailto:support@protonmedicare.com">support@protonmedicare.com</a></p>
            </div>
        </div>
    </div>
</body>
</html>`,
    });
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
}

// **Handle POST requests**
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // **Send Reset PIN**
    if (action === "send_email") {
      const validated = emailSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json(
          { success: false, message: "Invalid email" },
          { status: 400 },
        );
      }

      const { email } = validated.data;

      // Check if user exists
      const user = await prisma.users.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json(
          { success: false, message: "Email not found" },
          { status: 404 },
        );
      }

      const pin = generatePin();
      await prisma.users.update({
        where: { email },
        data: {
          resetPin: pin,
          resetPinExpiry: new Date(Date.now() + 10 * 60 * 1000),
        }, // Expires in 10 minutes
      });

      await sendResetEmail(
        email,
        pin,
        user.firstName ?? "User",
        user.resetPinExpiry?.toLocaleString() ?? "10 minutes",
      ); // Use user's first name from DB or fallback to 'User'

      return NextResponse.json({
        success: true,
        message: "Reset PIN sent successfully.",
      });
    }

    // **Verify PIN**
    if (action === "verify_pin") {
      const validated = pinSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json(
          { success: false, message: "Invalid PIN format" },
          { status: 400 },
        );
      }

      const { email, pin } = validated.data;
      const user = await prisma.users.findFirst({
        where: { email, resetPin: pin },
      });

      if (!user || new Date() > new Date(user.resetPinExpiry!)) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired PIN" },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "PIN verified successfully.",
      });
    }

    // **Reset Password**
    if (action === "reset_password") {
      const validated = resetSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json(
          { success: false, message: "Invalid password data" },
          { status: 400 },
        );
      }

      const { email, pin, new_password } = validated.data;
      const user = await prisma.users.findFirst({
        where: { email, resetPin: pin },
      });

      if (!user || new Date() > new Date(user.resetPinExpiry!)) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired PIN" },
          { status: 400 },
        );
      }

      await prisma.users.update({
        where: { email },
        data: { password: new_password, resetPin: null, resetPinExpiry: null },
      });

      await sendConfirmationEmail(email, user.firstName ?? "User"); // Send success email

      return NextResponse.json({
        success: true,
        message: "Password reset successfully.",
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error handling password reset:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
