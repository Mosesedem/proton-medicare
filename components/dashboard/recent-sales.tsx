// app/dashboard/health-plans/recent-sales.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function RecentSales() {
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
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
  });

  if (healthPlans.length === 0) {
    return (
      <div className="space-y-8 p-4 text-center text-gray-500">
        No recent sales.
      </div>
    );
  }

  const formattedHealthPlans = healthPlans.map((plan) => ({
    id: plan.id,
    name: `${plan.firstName} ${plan.lastName}`,
    email: plan.email,
    phone: plan.phone,
    startDate: plan.startDate,
    endDate: plan.endDate,
    expired: plan.expired,
    imagePath: plan.imagePath,
    hospitalListUrl: plan.hospitalListUrl,
    createdAt: plan.createdAt,
    planType: plan.enrollment.plan || "Basic Plan",
    price: plan.enrollment.amount || 0,
    initials:
      `<span class="math-inline">\{plan\.firstName\.charAt\(0\)\}</span>{plan.lastName.charAt(
      0
    )}`.toUpperCase(),
    avatarSrc: plan.imagePath
      ? plan.imagePath
      : `/avatars/${Math.floor(Math.random() * 5) + 1}.png`,
  }));

  return (
    <div className="space-y-8">
      {formattedHealthPlans.map((plan) => (
        <div key={plan.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            {plan.imagePath ? (
              <AvatarImage src={plan.imagePath} alt="Avatar" />
            ) : (
              <AvatarImage
                src={`/avatars/${Math.floor(Math.random() * 5) + 1}.png`}
                alt="Avatar"
              />
            )}
            <AvatarFallback>{plan.initials}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{plan.name}</p>
            <p className="text-sm text-muted-foreground">{plan.planType}</p>
          </div>
          <div className="ml-auto font-medium">
            +₦{plan.price.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
