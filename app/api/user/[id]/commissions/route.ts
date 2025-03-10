// app/api/user/[id]/commissions/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
// import { use } from "react";

export async function GET(
  request: NextRequest
  // context: { params: { id: string } }
) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "No valid token provided" },
      { status: 401 }
    );
  }

  const user = await requireAuth();

  // if (!user || user.id !== context.params.id) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  const userData = await prisma.user.findUnique({
    where: {
      id: user.id,
      // context.params.id
    },
    include: {
      transactions: true,
      withdrawals: true,
    },
  });

  if (!userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(userData);
}
