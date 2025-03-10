// import { Suspense } from "react";
// import profilePage from "./profilecontent";
// import { Skeleton } from "@/components/ui/skeleton";
// import { requireAuth } from "@/lib/auth";
// import { redirect } from "next/navigation";

// export default async function ProfilePage() {
//   const user = await requireAuth();
//   if (!user) {
//     redirect("/signin");
//   }

//   return (
//     // <Suspense
//     //   fallback={
//     //     <div className="p-4 max-w-md border rounded-lg">
//     //       <Skeleton className="w-20 h-20 rounded-full mb-4" />
//     //       <Skeleton className="h-6 w-3/5 mb-2" />
//     //       <Skeleton className="h-4 w-full mb-1" />
//     //       <Skeleton className="h-4 w-4/5 mb-1" />
//     //       <Skeleton className="h-4 w-3/4 mb-1" />
//     //     </div>
//     //   }
//     // >
//     <ProfilePage />
//     // </Suspense>
//   );
// }
// app/(dashboard)/dashboard/profile/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/profile");

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false); // Ensure loading is set to false even on error
      }
    };

    fetchUserData();
  }, []);

  const handleSettingsClick = () => {
    router.push("/dashboard/settings");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 max-w-lg w-full text-center transition-colors duration-300">
        {user.image && (
          <Image
            src={user.image}
            alt="Profile Picture"
            width={120}
            height={120}
            className="rounded-full mx-auto border-4 border-teal-500 dark:border-teal-400"
          />
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4">
          {user.name}
        </h1>
        <div className="mt-4 space-y-2 text-gray-600 dark:text-gray-300">
          <p>
            <span className="font-semibold">Email:</span> {user.email}
          </p>
          {user.phone && (
            <p>
              <span className="font-semibold">Phone:</span> {user.phone}
            </p>
          )}
          {user.gender && (
            <p>
              <span className="font-semibold">Gender:</span> {user.gender}
            </p>
          )}
        </div>

        <Button
          onClick={handleSettingsClick}
          className="mt-6 bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Settings
        </Button>
      </div>
    </div>
  );
}
