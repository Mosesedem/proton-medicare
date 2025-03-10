import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/auth.config";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // First, check for NextAuth session (used for Google login)
    const nextAuthSession = await getServerSession(authOptions);

    // Check for custom JWT token in cookies (used for credential login)
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;

    // Handle NextAuth session (Google login)
    if (nextAuthSession) {
      return NextResponse.json({
        success: true,
        user: {
          id: nextAuthSession.user.id,
          email: nextAuthSession.user.email,
          firstName: nextAuthSession.user.firstName,
          lastName: nextAuthSession.user.lastName,
          isVerified: nextAuthSession.user.isVerified,
          role: nextAuthSession.user.role,
          authMethod: "google",
        },
        accessToken: nextAuthSession.accessToken,
      });
    }

    // Handle custom JWT session (credential login)
    if (authToken) {
      try {
        // Verify JWT
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as {
          id: string;
          email: string;
          role: string;
          iat: number;
          exp: number;
        };

        // Fetch user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            isVerified: true,
            role: true,
          },
        });

        if (!user) {
          return NextResponse.json(
            { success: false, message: "User not found" },
            { status: 404 },
          );
        }

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            isVerified: user.isVerified,
            role: user.role,
            authMethod: "credentials",
          },
          accessToken: authToken,
        });
      } catch (jwtError) {
        console.error("JWT verification error:", jwtError);
        return NextResponse.json(
          { success: false, message: "Invalid or expired token" },
          { status: 401 },
        );
      }
    }

    // No session found
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
