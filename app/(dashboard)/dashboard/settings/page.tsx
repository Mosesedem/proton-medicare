import { Suspense } from "react";
import SettingsPagecontent from "./settingsContent";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await requireAuth();
  if (!user) {
    redirect("/signin");
  }

  return (
    <Suspense
      fallback={
        <div className="p-4 max-w-md border rounded-lg">
          <Skeleton className="w-20 h-20 rounded-full mb-4" />
          <Skeleton className="h-6 w-3/5 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-4/5 mb-1" />
          <Skeleton className="h-4 w-3/4 mb-1" />
        </div>
      }
    >
      <SettingsPagecontent />
    </Suspense>
  );
}
