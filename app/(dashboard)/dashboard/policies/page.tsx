// app/dashboard/health-plans/page.tsx
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { DataTable } from "@/components/dashboard/data-table";
import { columns } from "@/components/dashboard/columns";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { CirclePlus } from "lucide-react";

export default async function HealthPlansPage() {
  const userId = await requireAuth();

  if (!userId) {
    redirect("/signin");
  }

  const healthPlans = await prisma.healthPlan.findMany({
    where: {
      status: "active",
      userId: userId.id,
    },
    include: {
      enrollment: true,
      User: true,
    },
  });

  const formattedHealthPlans = healthPlans.map((plan) => ({
    id: plan.id,
    name: `${plan.firstName} ${plan.lastName}`,
    firstName: plan.firstName,
    lastName: plan.lastName,
    email: plan.email,
    phone: plan.phone,
    startDate: plan.startDate,
    endDate: plan.endDate,
    expired: plan.expired,
    imagePath: plan.imagePath,
    hospitalListUrl: plan.hospitalListUrl,
    createdAt: plan.createdAt,
    idCardUrl: plan.idCardUrl,
    amount: plan.amount ?? 0,
    enrollmentId: plan.enrollmentId?.toString(),
    plan: plan.enrollment.plan,

    providerPolicyId: plan.providerPolicyId,
  }));

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="mt-14 flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Health Plans</h2>
        <button className="rounded-md bg-teal-500 px-4 py-2 align-middle text-white hover:bg-teal-600">
          <Link href="/dashboard/enroll">
            <CirclePlus size={24} />
          </Link>
        </button>
      </div>
      <DataTable
        columns={columns}
        data={formattedHealthPlans}
        user={{
          firstName: healthPlans[0]?.User?.firstName || "",
          lastName: healthPlans[0]?.User?.lastName || "",
          email: healthPlans[0]?.User?.email || "",
          phone: healthPlans[0]?.User?.phone || "",
        }}
      />
    </div>
  );
}
