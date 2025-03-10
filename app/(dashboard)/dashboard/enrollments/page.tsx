// app/dashboard/enrollments/page.tsx
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { DataTable } from "@/components/dashboard/enrollments-table";
import { columns } from "@/components/dashboard/enrollments-columns";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { CirclePlus } from "lucide-react";

export default async function EnrollmentsPage() {
  const userId = await requireAuth();

  if (!userId) {
    redirect("/signin");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: "active",
      userId: userId.id,
      paymentStatus: "paid",
    },
    include: {
      payments: true,
      user: true,
    },
  });

  const formattedEnrollments = enrollments.map((enrollment) => ({
    id: enrollment.id,
    firstName: enrollment.firstName,
    lastName: enrollment.lastName,
    email: enrollment.email,
    phone: enrollment.phone,
    gender: enrollment.gender,
    plan: enrollment.plan,
    duration: enrollment.duration,
    amount: enrollment.amount,
    paymentStatus: enrollment.paymentStatus,
    status: enrollment.status,
    createdAt: enrollment.createdAt,
    headshotUrl: enrollment.headshotUrl,
  }));

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mt-14">
        <h2 className="text-3xl font-bold tracking-tight">Enrollments</h2>
        <div className="flex items-center space-x-4 relative">
          <button className="px-4 py-2 text-white bg-teal-500 rounded-md align-middle hover:bg-teal-600">
            <Link href="/dashboard/enroll">
              <CirclePlus size={24} />
            </Link>
          </button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={formattedEnrollments}
        healthPlans={[]}
      />
    </div>
  );
}
