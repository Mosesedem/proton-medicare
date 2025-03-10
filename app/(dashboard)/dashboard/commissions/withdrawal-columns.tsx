"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
};

export const withdrawalColumns: ColumnDef<Withdrawal>[] = [
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(Number.parseFloat(row.getValue("amount"))),
  },
  {
    accessorKey: "bankAccount",
    header: "Bank Account",
    cell: ({ row }) => {
      const bankAccount = row.getValue("bankAccount") as {
        bankName: string;
        accountNumber: string;
        accountName: string;
      };
      return (
        <div className="flex flex-col">
          <span className="font-medium">{bankAccount.bankName}</span>
          <span className="text-sm text-muted-foreground">
            {bankAccount.accountNumber} • {bankAccount.accountName}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "Approved"
              ? "default"
              : status === "Pending"
              ? "outline"
              : "destructive"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
  },
];
