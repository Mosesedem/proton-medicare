// lib/auth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Session {
  user: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    isVerified?: boolean;
    role?: string;
    image?: string;
  };
  accessToken?: string;
  authMethod: "google" | "credentials";
}

export async function getSession(): Promise<Session | null> {
  // Check NextAuth session (Google login)
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession) {
    return {
      user: {
        ...nextAuthSession.user,
        email: nextAuthSession.user.email ?? undefined,
        image: nextAuthSession.user.image ?? undefined,
      },
      accessToken: nextAuthSession.accessToken,
      authMethod: "google",
    };
  }

  // Check custom JWT (credential login)
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
        role: string;
      };

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
          image: true,
        },
      });

      if (user) {
        return {
          user: {
            ...user,
            firstName: user.firstName ?? undefined,
            lastName: user.lastName ?? undefined,
            phoneNumber: user.phoneNumber ?? undefined,
            image: user.image ?? undefined,
          },
          accessToken: authToken,
          authMethod: "credentials",
        };
      }
    } catch (error) {
      console.error("JWT verification error:", error);
    }
  }

  return null;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth(callbackUrl: string = "/dashboard") {
  const session = await getSession();

  if (!session || !session.user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session.user;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

// Cleanup
process.on("exit", async () => {
  await prisma.$disconnect();
});
