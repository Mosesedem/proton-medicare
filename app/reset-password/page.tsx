"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stage, setStage] = useState<"email" | "pin" | "password">("email");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (action: string, body: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        if (action === "send_email") setStage("pin");
        if (action === "verify_pin") setStage("password");
        if (action === "reset_password") router.push("/signin");
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
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
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
              />
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
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
              <Input
                placeholder="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                placeholder="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" className="mt-4 w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
