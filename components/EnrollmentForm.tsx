/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEnrollmentForm } from "@/hooks/useEnrollmentForm";
import { PersonalInfoStep } from "@/components/PersonalInfoStep";
import { AdditionalInfoStep } from "@/components/AdditionalInfoStep";
import { PreviewStep } from "@/components/PreviewStep";
import PaymentChoiceDialog from "@/components/PaymentChoiceDialog";
import Script from "next/script";
import { useLayoutConfig } from "@/contexts/LayoutConfigContext";
import { Eye, EyeOff, LoaderCircle, RefreshCw } from "lucide-react";
import { Slideshow } from "@/components/Slideshow";
import { Toaster, toast } from "sonner";
import { payWithEtegram } from "etegram-pay";
import Preloader from "./preloader";

declare global {
  interface Window {
    PaystackPop: any;
    EtegramPay: any;
  }
}

// Authentication Functions
export const checkEmail = async (email: string) => {
  const response = await fetch("/api/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return response.json();
};

export const login = async (email: string, password: string) => {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const register = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone: string,
) => {
  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName, phone }),
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    return data;
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
};

export const createEnrollment = async (formData: FormData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/create-enrollment", {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, message: "Authentication required" };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error in createEnrollment:", error);
    throw error;
  }
};

export interface ApiResponse {
  success: boolean;
  message: string;
  paymentUrl?: string;
  enrollment_id?: number;
  reference?: string;
}

export interface PaymentData {
  firstName: string;
  lastName: string;
  email: string;
  price: number;
  plan: string;
  enrollment_id: number;
  paymentType: "subscription" | "onetime";
}

export const initiatePayment = async (data: PaymentData) => {
  const response = await fetch("/api/initiate-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
};

export default function EnrollmentForm() {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"login" | "register">("login");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [paystackReady, setPaystackReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const {
    formData,
    price,
    previewImage,
    handleFileChange,
    handleSelectChange,
    setFormData,
  } = useEnrollmentForm();
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const { setConfig } = useLayoutConfig();
  const [userEmail, setUserEmail] = useState("");

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Invalid token");
        })
        .then((data) => {
          setUserEmail(data.email || "");
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setUserEmail("");
        });
    }
  }, []);

  useEffect(() => {
    setConfig({ hideHeader: false, hideFooter: true });
    return () => setConfig({ hideHeader: false, hideFooter: false });
  }, [setConfig]);

  // Validation Functions
  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[0-9]\d{1,14}$/;
    return phoneRegex.test(phone) && phone.length === 11;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name: string) => {
    return name.trim().length >= 2;
  };

  const validateDOB = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    return birthDate < today && !isNaN(birthDate.getTime());
  };

  const validateStep1 = (formData: any) => {
    const { firstName, lastName, email, phone } = formData;
    return (
      validateName(firstName) &&
      validateName(lastName) &&
      validateEmail(email) &&
      validatePhone(phone)
    );
  };

  const validateStep2 = (formData: any) => {
    const { plan, duration, maritalStatus, headshot, dob, gender } = formData;
    return (
      !!plan &&
      !!gender &&
      !!duration &&
      validateDOB(dob) &&
      !!maritalStatus &&
      !!headshot
    );
  };

  // Form Handlers
  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1(formData)) {
      toast.error("Please complete all required fields correctly");
      return;
    }
    if (currentStep === 2 && !validateStep2(formData)) {
      toast.error("Please complete all required fields correctly");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      headshot: null,
      dob: "",
      maritalStatus: "",
      gender: "",
      plan: "",
      duration: "",
      referral: "",
      planId: "",
    });
    setCurrentStep(1);
    setShowModal(false);
    setShowPaymentChoice(false);
    setEnrollmentId(null);
    setPassword("");
    setConfirmPassword("");
    toast.success("Form has been reset");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < 3) {
      handleNextStep();
      return;
    }

    setLoading(true);
    try {
      if (!isAuthenticated) {
        const emailCheck = await checkEmail(formData.email);
        setModalType(emailCheck.exists ? "login" : "register");
        setShowModal(true);
        return;
      }

      const enrollmentFormData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          enrollmentFormData.append(key, value);
        } else if (value != null) {
          enrollmentFormData.append(key, String(value));
        }
      });

      const enrollmentResult = await createEnrollment(enrollmentFormData);

      if (!enrollmentResult.success) {
        if (enrollmentResult.message === "Authentication required") {
          setModalType("login");
          setShowModal(true);
          return;
        }
        throw new Error(
          enrollmentResult.message || "Failed to create enrollment",
        );
      }

      setEnrollmentId(enrollmentResult.enrollment_id);
      setShowPaymentChoice(true);
      toast.success("Enrollment created successfully");
    } catch (error) {
      toast.error("Failed to process enrollment. Please try again.");
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async () => {
    setLoading(true);
    try {
      let authResult;
      if (modalType === "register") {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }
        authResult = await register(
          formData.email,
          password,
          formData.firstName,
          formData.lastName,
          formData.phone,
        );
      } else {
        authResult = await login(formData.email, password);
      }

      if (authResult.success) {
        setIsAuthenticated(true);
        setShowModal(false);

        // Proceed with enrollment after successful auth
        const enrollmentFormData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (value instanceof File) {
            enrollmentFormData.append(key, value);
          } else if (value != null) {
            enrollmentFormData.append(key, String(value));
          }
        });

        const enrollmentResult = await createEnrollment(enrollmentFormData);
        if (enrollmentResult.success) {
          setEnrollmentId(enrollmentResult.enrollment_id);
          setShowPaymentChoice(true);
          toast.success("Successfully authenticated and enrolled");
        }
      } else {
        throw new Error(authResult.message || "Authentication failed");
      }
    } catch (error) {
      toast.error("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentChoice = async (type: "subscription" | "onetime") => {
    if (!enrollmentId) {
      toast.error("Enrollment not found");
      return;
    }

    if (type === "subscription" && !paystackReady) {
      toast.error("Payment system not ready. Please refresh and try again.");
      return;
    }

    setLoading(true);
    try {
      const paymentData: PaymentData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: userEmail || formData.email,
        price: price,
        plan: formData.plan,
        enrollment_id: enrollmentId,
        paymentType: type,
      };

      const paymentResult = await initiatePayment(paymentData);
      if (!paymentResult.success) {
        throw new Error(paymentResult.message || "Payment initiation failed");
      }

      if (type === "subscription") {
        const handler = window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
          email: userEmail || formData.email,
          plan: paymentResult.plan_code,
          ref: paymentResult.reference,
          metadata: { ...paymentResult.metadata },
          callback: (response: any) => {
            if (response.status === "success") {
              toast.success("Subscription successful!");
              window.location.href = "/dashboard/enrollments";
            }
          },
          onClose: () => {
            toast.info("Payment window closed");
            setLoading(false);
          },
        });
        handler.openIframe();
      } else {
        await payWithEtegram({
          projectID:
            process.env.ETEGRAM_PROJECT_ID || "67c4467f0a013a02393e6142",
          publicKey:
            process.env.ETEGRAM_PROJECT_PUBLIC_KEY ||
            "pk_live-5b7363cc53914ddda99f45757052c36f",
          phone: formData.phone,
          firstname: formData.firstName,
          lastname: formData.lastName,
          email: userEmail || formData.email,
          amount: price.toString(),
          reference: paymentResult.reference,
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      if (type !== "subscription") setLoading(false);
      setShowPaymentChoice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Preloader isLoading />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <div className="relative w-full overflow-y-auto p-8 md:w-1/2 md:p-12 lg:p-16">
        <div className="mb-12">
          <Script
            src="https://js.paystack.co/v1/inline.js"
            strategy="afterInteractive"
            onLoad={() => setPaystackReady(true)}
            onError={() => toast.error("Failed to load payment system")}
          />
        </div>

        <Card className="mx-auto w-full max-w-2xl shadow-none">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold">
                Enrollment Form
              </CardTitle>
              <CardDescription className="text-emerald-600">
                Step {currentStep} of 3
              </CardDescription>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="ml-auto h-12 px-6 text-teal-600 hover:text-teal-500"
              >
                <RefreshCw className="h-4 w-4 text-teal-600" />
                Reset Form
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {currentStep === 1 && (
                <PersonalInfoStep
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              )}
              {currentStep === 2 && (
                <AdditionalInfoStep
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSelectChange={handleSelectChange}
                  handleFileChange={handleFileChange}
                  price={price}
                />
              )}
              {currentStep === 3 && (
                <PreviewStep formData={formData} previewImage={previewImage} />
              )}
            </CardContent>

            <CardFooter className="flex justify-between pt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  onClick={handlePreviousStep}
                  variant="outline"
                  className="h-12 px-6"
                >
                  Previous
                </Button>
              )}
              <Button
                type={currentStep === 3 ? "submit" : "button"}
                onClick={currentStep < 3 ? handleNextStep : undefined}
                disabled={loading}
                className="ml-auto h-12 bg-teal-600 px-6 hover:bg-emerald-600"
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
                    Processing...
                  </div>
                ) : currentStep === 3 ? (
                  "Proceed to Payment"
                ) : (
                  "Next"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>
              {modalType === "login" ? "Login" : "Register"}
            </DialogTitle>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12"
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
              {modalType === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              )}
              <Button
                onClick={handleModalSubmit}
                disabled={loading}
                className="h-12 w-full bg-teal-600 hover:bg-emerald-600"
              >
                {loading
                  ? "Processing..."
                  : modalType === "login"
                    ? "Login"
                    : "Register"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <PaymentChoiceDialog
          open={showPaymentChoice}
          onClose={() => setShowPaymentChoice(false)}
          onChoose={handlePaymentChoice}
          price={price}
          duration={formData.duration}
        />

        <Toaster position="top-center" richColors closeButton />
      </div>
      <div className="fixed bottom-0 right-0 top-0 z-10 hidden w-1/2 md:block">
        <Slideshow />
      </div>
    </div>
  );
}
