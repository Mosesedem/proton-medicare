import {
  CreditCard,
  DollarSign,
  Users,
  Activity,
  Calendar,
  Heart,
  Shield,
  Lock,
} from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Overview } from "@/components/dashboard/overview"; // Assuming this exists
import { RecentSales } from "@/components/dashboard/recent-sales"; // Assuming this exists
import { plans } from "@/lib/constants";
import {
  ReactElement,
  JSXElementConstructor,
  ReactNode,
  ReactPortal,
  Key,
} from "react";

async function getUserData(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, image: true },
  });
}

async function getTotalRevenue(userId: string) {
  const totalRevenue = await prisma.transaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  const lastMonthRevenue = await prisma.transaction.aggregate({
    where: {
      userId,
      createdAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    },
    _sum: { amount: true },
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
      userId,
      endDate: { gt: new Date() },
    },
  });

  const lastMonthUsers = await prisma.healthPlan.count({
    where: {
      status: "active",
      userId,
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
    where: { userId },
    _sum: { commission: true },
  });

  const withdrawals = await prisma.withdrawal.aggregate({
    where: { userId, status: "Approved" },
    _sum: { amount: true },
  });

  const commissionBalance =
    (transactions._sum.commission || 0) - (withdrawals._sum.amount || 0);
  const lastMonthTransactions = await prisma.transaction.aggregate({
    where: {
      userId,
      createdAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
    },
    _sum: { commission: true },
  });

  const percentageChange = lastMonthTransactions._sum.commission
    ? ((commissionBalance - (lastMonthTransactions._sum.commission || 0)) /
        (lastMonthTransactions._sum.commission || 1)) *
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
      userId,
      endDate: { gt: currentDate },
    },
  });

  const lastHourPlans = await prisma.healthPlan.count({
    where: {
      status: "active",
      userId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });

  return {
    total: activePlans,
    sinceLastHour: lastHourPlans,
  };
}

interface PlanName {
  id: string;
  name: string;
  amount?: number | null;
  endDate: Date;
  status: string;
  plan: string;
  healthPlan: {
    id: string;
    providerPolicyId: string | number;
  };
  providerPolicyId: string | number;
}

async function getPlanNames(userId: string) {
  const enrollments = await prisma.healthPlan.findMany({
    where: { userId, status: "active" },
    select: {
      id: true,
      status: true,
      amount: true,
      endDate: true,
      providerPolicyId: true,
      // plan: true,

      Plan: { select: { name: true } },
      enrollment: {
        select: {
          id: true,
          plan: true,
        },
      },
    },
  });

  return enrollments.map((enrollment) => ({
    id: enrollment.id,
    name: enrollment.Plan[0]?.name || "",
    amount: enrollment.amount,
    endDate: enrollment.endDate || new Date(),
    status: enrollment.status,
    plan: enrollment.enrollment?.plan || "",
    healthPlan: {
      id: enrollment.id || "",
      providerPolicyId: enrollment.providerPolicyId || "",
    },
    providerPolicyId: enrollment.providerPolicyId || "",
  }));
}

async function getHealthPlans(userId: string) {
  const dbPlans = await prisma.healthPlan.findMany({
    where: { userId, status: "active" },
    select: {
      id: true,
      Plan: true,
      amount: true,
      endDate: true,
      status: true,
    },
  });

  // Map database plans to include benefits from constants.ts
  return dbPlans.map((dbPlan) => {
    const matchingPlan = plans.find((p) => p.id === dbPlan.id);
    return {
      ...dbPlan,
      additionalBenefits: matchingPlan?.additionalBenefits || [],
    };
  });
}

interface RenewalPlan {
  id: string;
  providerPolicyId: string | number;
  endDate: Date;
  planName: string;
  amount: number;
  additionalBenefits: string[];
}

async function getUpcomingRenewals(userId: string) {
  const dbRenewals = await prisma.healthPlan.findMany({
    where: {
      userId,
      endDate: { gte: new Date() },
    },
    select: {
      id: true,
      providerPolicyId: true,
      endDate: true,
      enrollment: { select: { plan: true } },
      amount: true,
    },
    take: 5,
    orderBy: { endDate: "asc" },
  });

  // Map database renewals to include plan name and benefits
  return dbRenewals.map((dbRenewal) => {
    const matchingPlan = plans.find((p) => p.id === dbRenewal.id);
    return {
      id: dbRenewal.id,
      providerPolicyId: dbRenewal.providerPolicyId,
      endDate: dbRenewal.endDate,
      // Handle both cases - Plan as an array or Plan as an object
      planName: Array.isArray(dbRenewal.enrollment)
        ? dbRenewal.enrollment[0]?.name || "Unknown Plan"
        : dbRenewal.enrollment?.plan || "Unknown Plan",
      amount: dbRenewal.amount || 0,
      additionalBenefits: matchingPlan?.additionalBenefits || [],
    } as RenewalPlan;
  });
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export default async function NigerianInsuranceDashboard() {
  const user = await requireAuth();

  if (!user) {
    redirect("/signin");
  }

  const [
    userData,
    totalRevenue,
    activeUsers,
    commissionBalance,
    activePlans,
    healthPlans,
    upcomingRenewals,
    planNames,
  ]: [any, any, any, any, any, any, RenewalPlan[], PlanName[]] =
    await Promise.all([
      getUserData(user.id),
      getTotalRevenue(user.id),
      getActiveUsers(user.id),
      getCommissionBalance(user.id),
      getActivePlans(user.id),
      getHealthPlans(user.id),
      getUpcomingRenewals(user.id),
      getPlanNames(user.id),
    ]);

  if (!userData) {
    redirect("/signin");
  }

  // Aggregate all unique benefits from active plans
  const planBenefits = Array.from(
    new Set(
      plans.flatMap((plan) =>
        plan.additionalBenefits.map((benefit) => ({
          benefit,
          coverage: "Included",
        })),
      ),
    ),
  ).slice(0, 6);

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-col items-center justify-between rounded-xl border border-border/30 bg-accent p-6 shadow-sm md:flex-row">
        <div className="mb-4 text-center md:mb-0 md:text-left">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-primary md:text-3xl">
            👋 Welcome, {userData.firstName} {userData.lastName}
          </h1>
          <p className="mt-1 text-gray-600">
            Nigerian Health Insurance Broker Portal
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="inline-flex items-center rounded-full bg-teal-500 px-3 py-1 text-sm font-medium text-primary">
              <Lock className="mr-1 h-3.5 w-3.5" />
              Broker ID: {userData.id.substring(0, 8)}
            </div>
          </div>
          {userData.image ? (
            <Image
              src={userData.image}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <span className="rounded-full">
              {userData.firstName?.charAt(0) ?? "U"}
            </span>
          )}
        </div>
      </header>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Number(totalRevenue.percentageChange) > 0 ? "+" : ""}
              {totalRevenue.percentageChange}% from last month
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
              {Number(activeUsers.percentageChange) > 0 ? "+" : ""}
              {activeUsers.percentageChange}% from last month
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
              {formatCurrency(commissionBalance.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Number(commissionBalance.percentageChange) > 0 ? "+" : ""}
              {commissionBalance.percentageChange}% from last month
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
              +{activePlans.sinceLastHour} in the last hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-xl border border-border/30 bg-primary-foreground p-1 shadow-sm">
          {["overview", "plans", "benefits", "renewals"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-lg capitalize"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="hidden md:col-span-2 md:block lg:col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentSales />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Active Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-4 font-medium">ID</th>
                      <th className="pb-4 font-medium">Plan Name</th>
                      <th className="pb-4 font-medium">Type</th>
                      <th className="pb-4 font-medium">Monthly Cost</th>
                      <th className="pb-4 font-medium">Renewal</th>
                      <th className="pb-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planNames.slice(0, 5).map((plan) => (
                      <tr key={plan.id} className="border-b last:border-0">
                        <td className="py-4 text-sm font-medium">
                          {plan.healthPlan.providerPolicyId}
                        </td>
                        <td className="py-4 text-sm">{plan.plan}</td>
                        <td className="py-4 text-sm">Health Insurance</td>
                        <td className="py-4 text-sm">
                          {formatCurrency(plan.amount ?? 0)}
                        </td>
                        <td className="py-4 text-sm">
                          {new Date(plan.endDate).toLocaleDateString("en-NG")}
                        </td>
                        <td className="py-4">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            {plan.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-right">
                <a
                  href="/dashboard/policies"
                  className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                >
                  View All
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Plan Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {planBenefits.length > 0 ? (
                  planBenefits.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4"
                    >
                      <p className="font-medium text-gray-900">
                        {item.benefit}
                      </p>
                      <p className="font-medium text-primary">
                        {item.coverage}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-4 text-center text-sm text-gray-500">
                    No benefits found for active plans
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Renewals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingRenewals.slice(0, 3).map((renewal) => (
                  <div
                    key={String(renewal.providerPolicyId)}
                    className="flex flex-col justify-between rounded-xl border border-blue-100 bg-gradient-to-r from-white to-blue-50/50 p-4 md:flex-row md:items-center"
                  >
                    <div className="mb-3 md:mb-0">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-primary">
                          {renewal.providerPolicyId}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(renewal.endDate).toLocaleDateString(
                            "en-NG",
                          )}
                        </p>
                      </div>
                      <h3 className="mt-1 font-medium">{renewal.planName}</h3>
                      <p className="text-sm text-gray-600">HMO</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-primary">
                        {formatCurrency(renewal.amount)}
                      </div>
                      <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90">
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right">
                <a
                  href="/dashboard/policies"
                  className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                >
                  View All
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
