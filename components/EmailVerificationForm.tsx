// components/EmailVerificationForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resendVerificationCode } from "@/app/api/verifyemail/route";
import { useFormState } from "react-dom";

interface EmailVerificationFormProps {
  email: string;
  onPinRequest: () => void;
  onEditEmail: () => void;
}

export function EmailVerificationForm({
  email,
  onPinRequest,
  onEditEmail,
}: EmailVerificationFormProps) {
  const [state, formAction] = useFormState(resendVerificationCode, null);
  const [isPending, setIsPending] = useState(false);

  const handleResend = async (formData: FormData) => {
    setIsPending(true);
    try {
      formAction(formData);
      toast.success("Verification email sent! Please check your inbox.");
      onPinRequest();
    } catch (error) {
      toast.error("Failed to resend verification email");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground">Verification email sent to:</p>
        <p className="font-medium">{email}</p>
      </div>

      <div className="space-y-4">
        <form action={handleResend}>
          <input type="hidden" name="email" value={email} />
          <Button
            type="submit"
            variant="default"
            className="w-full bg-teal-600 hover:bg-teal-700"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Mail className="mr-2 h-4 w-4" />
            Resend Verification Email
          </Button>
        </form>

        <Button onClick={onEditEmail} variant="outline" className="w-full">
          Edit Email Address
        </Button>
      </div>
    </div>
  );
}
