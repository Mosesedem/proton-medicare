"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { transactionColumns } from "./columns";
import { withdrawalColumns } from "./withdrawal-columns";
import { useSession } from "next-auth/react";
import { WithdrawalDialog } from "./withdrawal-dialog";
import { BankAccountDialog } from "./bank-account-dialog";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BanknoteIcon,
  CreditCard,
  DollarSign,
  Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
  id: string;
  amount: number;
  commission: number;
  type: string;
  status: string;
  createdAt: Date;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface User {
  id: string;
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  bankAccounts: BankAccount[];
}

export default function CommissionsPage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [bankAccountDialogOpen, setBankAccountDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserId() {
      try {
        const response = await fetch("/api/auth/user");
        if (!response.ok) {
          router.push("/signin");
          return;
        }
        const data = await response.json();
        setUserId(data.userId || "");
      } catch (error) {
        console.error("Error fetching user ID:", error);
        router.push("/signin");
      }
    }

    async function fetchData() {
      if (!userId) return;

      try {
        const response = await fetch(`/api/user/${userId}/commissions`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken || ""}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Commissions error:", errorData);
          router.push("/signin");
          return;
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching commission data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status !== "loading") {
      fetchUserId();
    }
    if (userId) {
      fetchData();
    }
  }, [session, status, userId, router]);

  const handleWithdrawalSuccess = async () => {
    // Refetch data after successful withdrawal
    if (userId) {
      setLoading(true);
      const response = await fetch(`/api/user/${userId}/commissions`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken || ""}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
      setLoading(false);
    }
  };

  const handleBankAccountSuccess = async () => {
    // Refetch data after bank account is added/updated
    if (userId) {
      setLoading(true);
      const response = await fetch(`/api/user/${userId}/commissions`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken || ""}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalSales =
    user?.transactions.reduce(
      (sum, tx) => sum + (tx.status === "Success" ? tx.amount : 0),
      0
    ) || 0;

  const totalCommission =
    user?.transactions.reduce(
      (sum, tx) => sum + (tx.status === "Success" ? tx.commission : 0),
      0
    ) || 0;

  const totalWithdrawn =
    user?.withdrawals.reduce(
      (sum, withdrawal) =>
        sum + (withdrawal.status === "Approved" ? withdrawal.amount : 0),
      0
    ) || 0;

  const pendingWithdrawals =
    user?.withdrawals.reduce(
      (sum, withdrawal) =>
        sum + (withdrawal.status === "Pending" ? withdrawal.amount : 0),
      0
    ) || 0;

  const availableBalance =
    totalCommission - totalWithdrawn - pendingWithdrawals;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const transactions =
    user?.transactions.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      commission: transaction.commission,
      type: transaction.type,
      status: transaction.status,
      createdAt: transaction.createdAt,
    })) || [];

  const withdrawals =
    user?.withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      amount: withdrawal.amount,
      status: withdrawal.status,
      createdAt: withdrawal.createdAt,
      bankAccount: withdrawal.bankAccount,
    })) || [];

  const hasBankAccounts = user?.bankAccounts && user.bankAccounts.length > 0;

  if (status === "loading" || loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-8 w-[250px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 mt-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Commissions & Withdrawals
        </h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setBankAccountDialogOpen(true)}
          >
            <BanknoteIcon className="mr-2 h-4 w-4" />
            Manage Bank Accounts
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => setWithdrawalDialogOpen(true)}
            disabled={!hasBankAccounts || availableBalance <= 0}
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Withdraw Funds
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {formatCurrency(totalSales)}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime sales amount
            </p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Commission
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {formatCurrency(totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime commission earned
            </p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Withdrawn
            </CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {formatCurrency(totalWithdrawn)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total amount withdrawn
            </p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {formatCurrency(availableBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingWithdrawals > 0
                ? `${formatCurrency(pendingWithdrawals)} pending`
                : "Available for withdrawal"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all your commission transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={transactionColumns}
                data={transactions}
                searchKey="type"
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>
                View all your withdrawal requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={withdrawalColumns}
                data={withdrawals}
                searchKey="status"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {user && (
        <>
          <WithdrawalDialog
            open={withdrawalDialogOpen}
            onOpenChange={setWithdrawalDialogOpen}
            userId={userId}
            availableBalance={availableBalance}
            bankAccounts={user.bankAccounts || []}
            onSuccess={handleWithdrawalSuccess}
          />
          <BankAccountDialog
            open={bankAccountDialogOpen}
            onOpenChange={setBankAccountDialogOpen}
            userId={userId}
            bankAccounts={user.bankAccounts || []}
            onSuccess={handleBankAccountSuccess}
          />
        </>
      )}
    </div>
  );
}
