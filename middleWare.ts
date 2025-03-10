/* eslint-disable @typescript-eslint/no-unused-vars */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Add any custom logic here

    // Example: Redirect to profile completion if user hasn't finished setup
    // const userComplete = req.nextauth.token?.userComplete;
    // if (req.nextUrl.pathname.startsWith("/dashboard") && !userComplete) {
    //   return NextResponse.redirect(new URL("/complete-profile", req.url));
    // }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    // Add other protected routes
  ],
};
