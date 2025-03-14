import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useFormState } from "react-dom";
// import { updateEmail } from "@/app/api/verifyemail/route";

export function UpdateEmailForm({
  currentEmail,
  onBack,
  onEmailUpdated,
}: {
  currentEmail: string;
  onBack: () => void;
  onEmailUpdated: (newEmail: string) => void;
}) {
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append("action", "updateEmail");
      formData.append("email", email);
      formData.append("password", password);

      const response = await fetch("/api/verifyemail", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Email updated! Please verify your new email.");
        sessionStorage.setItem("unverifiedEmail", email);
        onEmailUpdated(email);
      } else {
        toast.error(data.message || "Failed to update email");
      }
    } catch (error) {
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
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter new email address"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password"> Enter Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              value={password}
              type={showPassword ? "text" : "password"}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Email"
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onBack}
          disabled={isUpdating}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
