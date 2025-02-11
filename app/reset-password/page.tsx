"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stage, setStage] = useState<"email" | "pin" | "password">("email");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const validatePassword = () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }

    const passwordRegex = /^.{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError("Password must be at least 6 characters long");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleSubmit = async (action: string, body: any) => {
    setLoading(true);
    try {
      // Password validation only for reset_password action
      if (action === "reset_password" && !validatePassword()) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        if (action === "send_email") {
          setStage("pin");
        } else if (action === "verify_pin") {
          setStage("password");
        } else if (action === "reset_password") {
          router.push("/signin");
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            {stage === "email" && "Enter your email to receive a reset PIN"}
            {stage === "pin" && "Enter the 6-digit PIN sent to your email"}
            {stage === "password" && "Create a new password"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {stage === "email" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit("send_email", { email });
              }}
            >
              <Input
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="mt-4 w-full bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500 hover:from-teal-600 hover:to-teal-500"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Send PIN"}
              </Button>
            </form>
          )}

          {stage === "pin" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit("verify_pin", { email, pin });
              }}
            >
              <Input
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                className="text-center"
              />
              <Button
                type="submit"
                className="mt-4 w-full bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500 hover:from-teal-600 hover:to-teal-500"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Verify PIN"}
              </Button>
            </form>
          )}

          {stage === "password" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit("reset_password", {
                  email,
                  pin,
                  new_password: newPassword,
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    placeholder="New password"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div className="mt-4 space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    placeholder="Confirm password"
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {passwordError && (
                <p className="mt-2 text-sm text-red-500">{passwordError}</p>
              )}
              <Button
                type="submit"
                className="btn-primary mt-4 w-full bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500 hover:from-teal-600 hover:to-teal-500"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}

          <Button variant="ghost" size="lg" className="mt-4 w-full">
            <Link href="/signin">Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
