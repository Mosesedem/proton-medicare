"use client"; // Add this directive since we're using client-side hooks

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-provider";
import { Sidebar } from "@/components/dashboard/sidebar";
import Preloader from "@/components/preloader";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [pathname]);

  return (
    <div className="h-full relative">
      <div className=" h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-muted">
        <Sidebar />
      </div>
      <Preloader isLoading={isLoading} />
      <AuthProvider>
        <main className="md:pl-72">{children}</main>
      </AuthProvider>
    </div>
  );
}
