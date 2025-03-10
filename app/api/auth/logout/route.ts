// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { NextRequest, NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { signOut } from "next-auth/react";
// export async function POST(req: NextRequest) {
//   try {
//     const cookieStore = await cookies();

//     // Clear the custom JWT cookie
//     cookieStore.delete("auth_token");

//     // For NextAuth (Google), we'll rely on client-side signOut in the component,
//     // but we can invalidate any server-side session here if needed
//     // Since we're using JWT strategy with NextAuth, no server-side session to clear

//     return NextResponse.json(
//       { success: true, message: "Logged out successfully" },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Logout error:", error);
//     return NextResponse.json(
//       { success: false, message: "Failed to logout" },
//       { status: 500 }
//     );
//   }
// }

/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signOut } from "next-auth/react"; // Note: Server-side use requires adjustment

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Clear custom cookie (if still relevant)
    cookieStore.delete("auth_token");

    // Clear NextAuth session token
    cookieStore.delete("next-auth.session-token");

    // Note: signOut() is client-side only; for server-side, rely on cookie deletion
    // or call the NextAuth signout route internally if needed

    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to logout" },
      { status: 500 }
    );
  }
}
