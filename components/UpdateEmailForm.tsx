"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFormState } from "react-dom";
import { updateEmail } from "@/app/api/verifyemail/route";

interface UpdateEmailFormProps {
  currentEmail: string;
  onBack: () => void;
  onEmailUpdated: (newEmail: string) => void;
}

export function UpdateEmailForm({
  currentEmail,
  onBack,
  onEmailUpdated,
}: UpdateEmailFormProps) {
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [state, formAction] = useFormState(updateEmail, null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const result = await formAction(formData);

      if (result?.success) {
        toast.success("Email updated! Please verify your new email.");
        sessionStorage.setItem("unverifiedEmail", email);
        onEmailUpdated(email);
      } else {
        toast.error(result?.message || "Failed to update email");
      }
    } catch (error) {
      console.error("Email update error:", error);
      toast.error("An error occurred while updating email");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">New Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter new email address"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Confirm Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <Button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700"
          disabled={isUpdating}
        >
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Email
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onBack}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
