"use client"; // Ensure this runs on the client side

import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Error UI wrapped inside Suspense
const AuthErrorContent = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "";

  let errorMessage = "An error occurred during authentication.";
  let errorDescription =
    "Please try again or contact support if the problem persists.";

  if (error.includes("OAuthAccountNotLinked")) {
    errorMessage = "Email already in use with different provider";
    errorDescription =
      "This email is already associated with an account using a different sign-in method. " +
      "Please sign in using your original account method.";
  } else if (error.includes("verify your email")) {
    errorMessage = "Email verification required";
    errorDescription = "Please verify your email address before signing in.";
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <CardTitle>Authentication Error</CardTitle>
        </div>
        <CardDescription>{errorMessage}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{errorDescription}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" asChild>
          <Link href="/signin">Back to Sign In</Link>
        </Button>
        <Button asChild>
          <Link href="/support">Contact Support</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Wrap AuthErrorContent inside Suspense
const AuthError = () => {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Suspense fallback={<p>Loading...</p>}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
};

export default AuthError;
