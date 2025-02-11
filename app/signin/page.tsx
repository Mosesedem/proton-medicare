"use client";

import { useState, type FormEvent } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Slideshow } from "@/components/Slideshow";
import { useLayoutConfig } from "@/contexts/LayoutConfigContext";

interface FormData {
  email: string;
  password: string;
}

export default function ModernSignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setConfig } = useLayoutConfig();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error("All fields are required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    return true;
  };
  useEffect(() => {
    setConfig({ hideHeader: false, hideFooter: true });
    return () => setConfig({ hideHeader: false, hideFooter: false });
  }, [setConfig]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("token", data.token);
        toast.success("Login successful!");
        router.push("/dashboard");
      } else {
        if (data.redirect?.includes("/auth/verify-email")) {
          sessionStorage.setItem("unverifiedEmail", formData.email);
          toast.error("Please verify your email address");
          router.push(
            `/auth/verify-email?email=${encodeURIComponent(formData.email)}`,
          );
        } else {
          toast.error(data.message || "Login failed");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex h-screen">
      <Toaster position="top-center" richColors closeButton />
      {/* Left side - Sign In Form */}
      <div className="w-full overflow-y-auto p-8 pt-[200px] md:w-1/2">
        <div className="mx-auto max-w-md">
          <h1 className="mb-6 text-3xl font-bold">Sign In</h1>
          <p className="mb-8 text-muted-foreground">
            Enter your credentials to access your account
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="focus:ring-2 focus:ring-teal-200"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/reset-password"
                    className="text-sm text-teal-500 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pr-10 focus:ring-2 focus:ring-teal-500"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-teal-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Slideshow */}
      <div className="hidden w-1/2 md:block">
        <Slideshow />
      </div>
    </div>
  );
}
