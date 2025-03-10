// components/dashboard/enrollments-columns.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Eye,
  // MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type Enrollment = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  plan: string;
  duration: string;
  amount: number;
  paymentStatus: string;
  status: string;
  createdAt: Date;
  headshotUrl: string;
};

const getDurationLabel = (duration: string): string => {
  const durationNumber = parseInt(duration);
  switch (durationNumber) {
    case 1:
      return "Monthly";
    case 3:
      return "Quarterly";
    case 6:
      return "Bi-annually";
    case 12:
      return "Yearly";
    default:
      return `${duration} Months`;
  }
};

export const columns: ColumnDef<Enrollment>[] = [
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 hover:bg-transparent hover:text-teal-700"
      >
        First Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 hover:bg-transparent hover:text-teal-700"
      >
        Last Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  // {
  //   accessorKey: "gender",
  //   header: "Gender",
  // },
  {
    accessorKey: "plan",
    header: "Plan",
    cell: ({ row }) => (
      <span className="font-medium text-teal-700">{row.getValue("plan")}</span>
    ),
  },
  {
    accessorFn: (row) => getDurationLabel(row.duration),
    id: "durationLabel",
    header: "Duration",
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 hover:bg-transparent hover:text-teal-700"
      >
        Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        ₦{(row.getValue("amount") as number).toLocaleString("en-NG")}
      </div>
    ),
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => {
      const status = row.getValue("paymentStatus") as string;
      return (
        <Badge
          className={`${
            status === "paid"
              ? "bg-green-100 text-gray-700 hover:bg-green-200"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {status.toLocaleUpperCase()}
        </Badge>
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
          className={`${
            status === "Active"
              ? "bg-teal-100 text-teal-800"
              : "bg-gray-100 text-gray-800"
          }`}
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
        className="p-0 hover:bg-transparent hover:text-teal-700"
      >
        Enrolled On
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        className="p-2 text-teal-600 hover:text-teal-800 hover:bg-teal-50"
        onClick={(e) => {
          e.stopPropagation();
          console.log("Viewing details for row:", row.id);
        }}
      >
        <Eye className="h-4 w-4" />
        <span className="sr-only">View details</span>
      </Button>
    ),
  },
];
