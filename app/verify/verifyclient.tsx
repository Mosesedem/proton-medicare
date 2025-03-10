/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState("Verifying your account...");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setMessage("Invalid verification link.");
      setStatus("error");
      return;
    }

    const verifyAccount = async () => {
      try {
        const response = await fetch(
          `/api/verify?token=${token}&email=${email}`
        );
        const data = await response.json();

        if (data.success) {
          setMessage("Account verified successfully! Redirecting...");
          setStatus("success");
          setTimeout(() => {
            router.push(data.redirect || "/signin");
          }, 3000);
        } else {
          setMessage(data.message || "Verification failed.");
          setStatus("error");
          setTimeout(() => {
            router.push("/signup");
          }, 3000);
        }
      } catch (error) {
        setMessage("An error occurred during verification.");
        setStatus("error");
      }
    };

    verifyAccount();
  }, [searchParams, router]);

  return (
    <div className="bg-background-100 flex h-screen items-center justify-center">
      <div className="rounded-lg bg-accent/80 p-6 text-center shadow-md">
        <h2 className="text-2xl font-semibold">Account Verification</h2>
        <p className="mt-4 text-lg">{message}</p>
        {status === "loading" && (
          <div className="mx-auto mt-4 h-6 w-6 animate-spin rounded-full border-t-2 border-teal-500"></div>
        )}
      </div>
    </div>
  );
}
