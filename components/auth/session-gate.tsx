"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface SessionGateProps {
  children: ReactNode;
  loadingComponent?: ReactNode;
  requireAuth?: boolean;
  fallbackComponent?: ReactNode;
}

export function SessionGate({
  children,
  loadingComponent,
  requireAuth = true,
  fallbackComponent,
}: SessionGateProps) {
  const { isLoading, isAuthenticated } = useAuth(requireAuth);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      const callbackUrl = window.location.pathname;
      router.push(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [isLoading, isAuthenticated, requireAuth, router]);

  if (isLoading) {
    return (
      loadingComponent || (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    );
  }

  if (requireAuth && !isAuthenticated) {
    return fallbackComponent || null;
  }

  return <>{children}</>;
}
