import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PinVerificationFormProps {
  email: string;
  onVerificationComplete: () => void;
  onBack: () => void;
}

export function PinVerificationForm({
  email,
  onVerificationComplete,
  onBack,
}: PinVerificationFormProps) {
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
        <Label htmlFor="pin">Enter Verification PIN</Label>
        <Input
          id="pin"
          name="pin"
          type="text"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter the PIN from your email"
          className="text-center text-lg tracking-wider"
          maxLength={6}
          required
        />
      </div>

      <div className="space-y-4">
        <Button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700"
          disabled={isVerifying}
        >
          {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

export default PinVerificationForm;
