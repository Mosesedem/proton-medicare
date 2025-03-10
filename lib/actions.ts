"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // if (!name || !email || !password) {
  //   throw new Error("Missing required fields");
  // }

  const user = await requireAuth();

  if (!user) {
    redirect("/sign-in");
  }

  const [firstName, lastName] = name.split(" ");

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password,
      merchantId: user.id,
    },
  });

  revalidatePath("/dashboard/users");
}

export async function createWithdrawal(amount: number, bankAccountId: string) {
  const user = await requireAuth();
  if (!user) {
    throw new Error("Unauthorized");
  }

  type UserWithRelations = {
    transactions: { commission: number }[];
    withdrawals: { amount: number }[];
  } & NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

  const userWithData = (await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      transactions: {
        where: {
          status: "Success",
        },
      },
      withdrawals: true,
    },
  })) as UserWithRelations;

  if (!user || !user.id) {
    throw new Error("User not found");
  }

  // Calculate available balance
  const totalCommission = userWithData.transactions.reduce(
    (acc, curr) => acc + curr.commission,
    0
  );
  const totalWithdrawn = userWithData.withdrawals.reduce(
    (acc, curr) => acc + curr.amount,
    0
  );
  const availableBalance = totalCommission - totalWithdrawn;

  if (amount > availableBalance) {
    throw new Error("Insufficient balance");
  }

  await prisma.withdrawal.create({
    data: {
      amount,
      status: "Pending",
      userId: user.id,
      bankAccountId,
    },
  });

  revalidatePath("/dashboard/commissions");
}
