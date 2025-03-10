import { CreditCard, DollarSign, Users, Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Overview } from "@/components/dashboard/overview";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function getTotalRevenue(userId: string) {
  const totalRevenue = await prisma.transaction.aggregate({
    where: {
      userId: userId,
    },
    _sum: {
      amount: true,
    },
  });

  const lastMonthRevenue = await prisma.transaction.aggregate({
    where: {
      userId: userId,
      createdAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    },
    _sum: {
      amount: true,
    },
  });

  const currentTotal = totalRevenue._sum.amount || 0;
  const lastMonthTotal = lastMonthRevenue._sum.amount || 0;
  const percentageChange = lastMonthTotal
    ? ((currentTotal - lastMonthTotal) / lastMonthTotal) * 100
    : 0;

  return {
    total: currentTotal,
    percentageChange: percentageChange.toFixed(1),
  };
}

async function getActiveUsers(userId: string) {
  const activeUsers = await prisma.healthPlan.count({
    where: {
      status: "active",
      userId: userId,
      endDate: {
        gt: new Date(),
      },
    },
  });

  const lastMonthUsers = await prisma.healthPlan.count({
    where: {
      status: "active",
      userId: userId,
      createdAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    },
  });

  const percentageChange = lastMonthUsers
    ? ((activeUsers - lastMonthUsers) / lastMonthUsers) * 100
    : 0;

  return {
    total: activeUsers,
    percentageChange: percentageChange.toFixed(1),
  };
}

async function getCommissionBalance(userId: string) {
  const transactions = await prisma.transaction.aggregate({
    where: {
      userId: userId,
    },
    _sum: {
      commission: true,
    },
  });

  const withdrawals = await prisma.withdrawal.aggregate({
    where: {
      userId: userId,
      status: "Approved",
    },
    _sum: {
      amount: true,
    },
  });

  const commissionBalance =
    (transactions._sum.commission || 0) - (withdrawals._sum.amount || 0);

  const lastMonthTransactions = await prisma.transaction.aggregate({
    where: {
      userId: userId,
      createdAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    },
    _sum: {
      commission: true,
    },
  });

  const percentageChange = lastMonthTransactions._sum.commission
    ? (((transactions._sum.commission ?? 0) -
        (lastMonthTransactions._sum.commission ?? 0)) /
        (lastMonthTransactions._sum.commission ?? 0)) *
      100
    : 0;

  return {
    total: commissionBalance,
    percentageChange: percentageChange.toFixed(1),
  };
}

async function getActivePlans(userId: string) {
  const currentDate = new Date();
  const activePlans = await prisma.healthPlan.count({
    where: {
      status: "active",
      userId: userId,
      endDate: {
        gt: currentDate,
      },
    },
  });

  const lastHourPlans = await prisma.healthPlan.count({
    where: {
      status: "active",
      userId: userId,
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000),
      },
    },
  });

  return {
    total: activePlans,
    sinceLastHour: lastHourPlans,
  };
}

export default async function DashboardPage() {
  const user = await requireAuth();

  if (!user) {
    redirect("/signin");
  }

  const [revenue, activeUsers, commissionBalance, activePlans] =
    await Promise.all([
      getTotalRevenue(user.id),
      getActiveUsers(user.id),
      getCommissionBalance(user.id),
      getActivePlans(user.id),
    ]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 mt-12">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{revenue.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{revenue.percentageChange}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers.total}</div>
            <p className="text-xs text-muted-foreground">
              +{activeUsers.percentageChange}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Commission Balance
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{commissionBalance.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{commissionBalance.percentageChange}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlans.total}</div>
            <p className="text-xs text-muted-foreground">
              +{activePlans.sinceLastHour} since last hour
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        {/* Overview Card */}
        <Card className="sm:col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>

        {/* Recent Sales Card */}
        <Card className="sm:col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentSales />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
