// app/api/user/profile/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth(); // Should throw or return null/undefined if unauthenticated
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        phone: true,
        gender: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: userData.id,
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      image: userData.image,
      phone: userData.phone,
      gender: userData.gender,
    });
  } catch (error: any) {
    console.error("Error fetching user data:", error);
    // Explicitly handle authentication errors
    if (error.message === "Unauthorized" || error.name === "AuthError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
