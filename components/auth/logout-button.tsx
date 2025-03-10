// "use client";

// import { useState } from "react";
// import { signOut } from "next-auth/react";
// import { Button } from "@/components/ui/button";
// import { Loader2, LogOut } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";

// interface LogoutButtonProps {
//   className?: string;
//   variant?:
//     | "default"
//     | "destructive"
//     | "outline"
//     | "secondary"
//     | "ghost"
//     | "link";
//   showIcon?: boolean;
// }

// export function LogoutButton({
//   className,
//   variant = "default",
//   showIcon = true,
// }: LogoutButtonProps) {
//   const [isLoading, setIsLoading] = useState(false);
//   const router = useRouter();

//   const handleLogout = async () => {
//     try {
//       setIsLoading(true);
//       await signOut({
//         redirect: false,
//         callbackUrl: "/signin",
//       });
//       toast.success("Logged out successfully");
//       router.push("/signin");
//       router.refresh(); // Refresh the current route to update server components
//     } catch (error) {
//       console.error("Logout error:", error);
//       toast.error("Error logging out. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Button
//       onClick={handleLogout}
//       disabled={isLoading}
//       variant={variant}
//       className={className}
//     >
//       {isLoading ? (
//         <>
//           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//           Logging out...
//         </>
//       ) : (
//         <>
//           {showIcon && <LogOut className="mr-2 h-4 w-4" />}
//           Logout
//         </>
//       )}
//     </Button>
//   );
// }
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component
import { useAuthContext } from "@/components/auth-provider"; // Updated path if needed
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { authMethod } = useAuthContext(); // Get the authentication method

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Clear custom JWT cookie via API
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // If Google auth was used, also sign out from NextAuth
      if (authMethod === "google") {
        await signOut({ redirect: false }); // Prevent immediate redirect
      }

      // Redirect to signin page or home
      router.push("/signin");
      router.refresh(); // Ensure page refreshes to clear any cached state
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      // variant="outline"
      className="flex w-full h-full items-center gap-2 text-sm text-red-500 hover:text-red-700 transition bg-inherit hover:bg-inherit"
    >
      <LogOut />
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  );
}
