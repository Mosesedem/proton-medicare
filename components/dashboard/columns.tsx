// components/dashboard/columns.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";

export type HealthPlan = {
  amount: number;
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  startDate: Date;
  endDate: Date;
  expired: boolean;
  enrollmentId: string;
  plan: string;
  imagePath: string;
  hospitalListUrl: string;
  createdAt: Date;
  providerPolicyId: number | null;
  idCardUrl: string | null;
};

export const columns: ColumnDef<HealthPlan>[] = [
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
      >
        First Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "providerPolicyId", header: "HMO ID" },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => formatDate(row.getValue("startDate")),
  },
  {
    accessorKey: "expired",
    header: "Status",
    cell: ({ row }) => (row.getValue("expired") ? "Expired" : "Active"),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions row={row} />,
  },
];

const CellActions = ({ row }: { row: any }) => {
  const plan = row.original;
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isHospitalOpen, setIsHospitalOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsImageOpen(true)}>
            View ID
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsHospitalOpen(true)}>
            View Hospital List
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
            View More Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Image Modal */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent>
          <Image
            src={plan.imagePath}
            alt="Health Plan ID"
            className="w-full"
            height={500}
            width={500}
          />

          <Button asChild>
            <a href={plan.imagePath} download>
              Download
            </a>
          </Button>
        </DialogContent>
      </Dialog>

      {/* Hospital List Modal */}
      <Dialog open={isHospitalOpen} onOpenChange={setIsHospitalOpen}>
        <DialogContent className="max-w-4xl">
          <iframe
            src={plan.hospitalListUrl}
            className="h-[500px] w-full"
            title="Hospital List"
          />
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <h3 className="text-lg font-bold">Health Plan Details</h3>
          <div className="space-y-2">
            <p>ID: {plan.providerPolicyId}</p>
            <p>Name: {plan.name}</p>
            <p>Email: {plan.email}</p>
            <p>Phone: {plan.phone}</p>
            <p>Start Date: {formatDate(plan.startDate)}</p>
            <p>End Date: {formatDate(plan.endDate)}</p>
            <p>Status: {plan.expired ? "Expired" : "Active"}</p>
            <p>Created At: {formatDate(plan.createdAt)}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
