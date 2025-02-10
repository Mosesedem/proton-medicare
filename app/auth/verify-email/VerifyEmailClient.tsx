//app/auth/verify-email/VerifyEmailClient.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailVerificationForm } from "@/components/EmailVerificationForm";
import { PinVerificationForm } from "@/components/PinVerificationForm";
import { UpdateEmailForm } from "@/components/UpdateEmailForm";

type VerificationStep = "initial" | "pin" | "update";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [currentStep, setCurrentStep] = useState<VerificationStep>("initial");

  useEffect(() => {
    const initialEmail =
      searchParams.get("email") ||
      sessionStorage.getItem("unverifiedEmail") ||
      "";
    setEmail(initialEmail);
  }, [searchParams]);

  const handleEmailUpdated = (newEmail: string) => {
    setEmail(newEmail);
    setCurrentStep("initial");
  };

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {currentStep === "initial" && "Email Verification"}
            {currentStep === "pin" && "Enter Verification PIN"}
            {currentStep === "update" && "Update Email Address"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === "initial" && (
            <EmailVerificationForm
              email={email}
              onPinRequest={() => setCurrentStep("pin")}
              onEditEmail={() => setCurrentStep("update")}
            />
          )}

          {currentStep === "pin" && (
            <PinVerificationForm
              email={email}
              onVerificationComplete={() => setCurrentStep("initial")}
            />
          )}

          {currentStep === "update" && (
            <UpdateEmailForm
              currentEmail={email}
              onBack={() => setCurrentStep("initial")}
              onEmailUpdated={handleEmailUpdated}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
