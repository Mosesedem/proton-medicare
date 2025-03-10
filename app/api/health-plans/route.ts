import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth"; // Adjust import based on your auth implementation

export async function GET() {
  try {
    // Authenticate the user
    const userId = await requireAuth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch health plans
    const healthPlans = await prisma.healthPlan.findMany({
      where: {
        status: "active",
        userId: userId.id,
      },
      include: {
        enrollment: true,
      },
      // take: 5,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group sales by month and aggregate total sales
    const monthlySales = healthPlans.reduce((acc, plan) => {
      const month = plan.createdAt.toLocaleString("default", {
        month: "short",
      });
      const amount = plan.enrollment?.amount || 0;

      const existingMonth = acc.find((item) => item.name === month);
      if (existingMonth) {
        existingMonth.total += amount;
      } else {
        acc.push({ name: month, total: amount });
      }

      return acc;
    }, [] as { name: string; total: number }[]);

    // If no sales, return some placeholder data
    if (monthlySales.length === 0) {
      return NextResponse.json([
        { name: "Jan", total: 0 },
        { name: "Feb", total: 0 },
        { name: "Mar", total: 0 },
        { name: "Apr", total: 0 },
        { name: "May", total: 0 },
        { name: "Jun", total: 0 },
        { name: "Jul", total: 0 },
        { name: "Aug", total: 0 },
        { name: "Sep", total: 0 },
        { name: "Oct", total: 0 },
        { name: "Nov", total: 0 },
        { name: "Dec", total: 0 },
      ]);
    }

    return NextResponse.json(monthlySales);
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales data" },
      { status: 500 }
    );
  }
}
