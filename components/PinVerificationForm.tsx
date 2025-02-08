"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { verifyEmail } from "@/app/api/verifyemail/route";

interface PinVerificationFormProps {
  email: string;
  onBack: () => void;
}

export function PinVerificationForm({
  email,
  onBack,
}: PinVerificationFormProps) {
  const [pin, setPin] = useState("");
  const [state, formAction] = useActionState(verifyEmail, null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleVerify = async (formData: FormData) => {
    setIsPending(true);
    try {
      const result = await formAction(formData);
      if (result?.success) {
        toast.success("Email verified successfully!");
        sessionStorage.removeItem("unverifiedEmail");
        setTimeout(() => router.push("/signin"), 2000);
      } else {
        toast.error(result?.message || "Verification failed");
      }
    } catch (error) {
      toast.error("An error occurred during verification");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form action={handleVerify} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="pin">Enter Verification PIN</Label>
        <Input
          id="pin"
          type="text"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter the PIN from your email"
          className="text-center text-lg tracking-wider"
          maxLength={6}
        />
      </div>

      <div className="space-y-4">
        <Button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700"
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify PIN
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onBack}
        >
          Back
        </Button>
      </div>
    </form>
  );
}
