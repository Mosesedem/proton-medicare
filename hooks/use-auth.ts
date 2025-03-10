"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth(requireAuth: boolean = true) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });
        const data = await response.json();

        if (data.success) {
          setIsAuthenticated(true);
        } else if (requireAuth) {
          const callbackUrl = window.location.pathname;
          router.push(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (requireAuth) {
          router.push("/signin");
        }
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router, requireAuth]);

  return { isLoading, isAuthenticated };
}
