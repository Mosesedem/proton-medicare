"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { LogoutButton } from "./logout-button";
import Link from "next/link";
import { User, Settings } from "lucide-react";
import { useEffect, useState } from "react";

export function UserButton() {
  const { data: session, status } = useSession();
  const [imageError, setImageError] = useState(false);
  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset image error state when session changes
  useEffect(() => {
    if (session) {
      setImageError(false);
    }
  }, [session]);

  // Fetch user data when session changes
  useEffect(() => {
    async function fetchUserData() {
      if (session?.user?.id) {
        setLoading(true);
        try {
          // Use API route instead of direct Prisma call
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
            console.log("Fetched user data:", data);
          } else {
            console.error("Failed to fetch user data");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  // For debugging
  useEffect(() => {
    if (session?.user) {
      console.log("Session user data:", session.user);
    }
  }, [session]);

  // Loading state
  if (status === "loading" || loading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  if (!session) {
    return (
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/signin">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  // Combine session data with the additional user data from the API
  const user = {
    ...session.user,
    ...(userData || {}),
  };

  // Check different possible locations for the image URL
  const imageUrl =
    user.image ||
    "https://www.etegram.com/pages/homepage/Unlock-Unimaginable-Payment.svg";

  // Generate initials as fallback
  let initials = "";
  if (user.firstName && user.lastName) {
    initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  } else if (user.name) {
    // If we have a full name string, split it to get initials
    const nameParts = user.name.split(" ");
    if (nameParts.length >= 2) {
      initials = `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    } else if (nameParts.length === 1) {
      initials = nameParts[0][0].toUpperCase();
    }
  } else if (user.email) {
    // Last resort - use first letter of email
    initials = user.email[0].toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12 rounded-full">
          <Avatar className="h-8 w-8">
            {imageUrl && !imageError ? (
              <AvatarImage
                src={imageUrl}
                alt={user.name || "User"}
                onError={() => setImageError(true)}
              />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name ||
                `${user.firstName || ""} ${user.lastName || ""}`.trim()}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <div className="w-full h-full">
            <LogoutButton />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
