import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PinVerificationFormProps {
  email: string;
  onBack: () => void;
}

// Define the expected response type
interface VerificationResponse {
  success: boolean;
  message: string;
  redirect?: string;
}

export function PinVerificationForm({
  email,
  onVerificationComplete,
}: {
  email: string;
  onVerificationComplete: () => void;
}) {
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      const formData = new FormData();
      formData.append("action", "verifyEmail");
      formData.append("email", email);
      formData.append("pin", pin);

      const response = await fetch("/api/verifyemail", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Email verified successfully!");
        sessionStorage.removeItem("unverifiedEmail");
        onVerificationComplete();
        if (data.redirect) {
          window.location.href = data.redirect;
        }
      } else {
        toast.error(data.message || "Failed to verify email");
      }
    } catch (error) {
      toast.error("An error occurred while verifying email");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="pin">Verification PIN</Label>
        <Input
          id="pin"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter 6-digit PIN"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-teal-600 hover:bg-teal-700"
        disabled={isVerifying || pin.length !== 6}
      >
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Email"
        )}
      </Button>
    </form>
  );
}
