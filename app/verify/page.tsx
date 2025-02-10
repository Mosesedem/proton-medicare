import { Suspense } from "react";
import VerifyClient from "./verifyclient";
import { Skeleton } from "@/components/ui/skeleton";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md rounded-lg border p-4">
          <Skeleton className="mb-4 h-20 w-20 rounded-full" />
          <Skeleton className="mb-2 h-6 w-3/5" />
          <Skeleton className="mb-1 h-4 w-full" />
          <Skeleton className="mb-1 h-4 w-4/5" />
          <Skeleton className="mb-1 h-4 w-3/4" />
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}
