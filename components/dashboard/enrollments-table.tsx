"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
  Row,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect } from "react";
import { Enrollment } from "./enrollments-columns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Preloader from "@/components/preloader";
import { toast } from "sonner";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableProps {
  columns: ColumnDef<Enrollment>[];
  data: Enrollment[];
  healthPlans: {
    enrollmentId: number;
    startDate: Date | null;
    status: string;
  }[];
  onPlanActivation?: () => void;
}

export function DataTable({
  columns,
  data,
  healthPlans,
  onPlanActivation,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    gender: false,
    phone: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<Enrollment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setColumnVisibility({
        email: window.innerWidth >= 640,
        phone: window.innerWidth >= 1024,
        gender: false,
        amount: window.innerWidth >= 640,
        paymentStatus: window.innerWidth >= 768,
        durationLabel: window.innerWidth >= 768,
      });
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleRowClick = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsDetailsOpen(true);
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

  const getPlanActivationStatus = (
    enrollmentId: number,
  ): { canActivate: boolean; message: string } => {
    const healthPlan = healthPlans.find(
      (plan) => plan.enrollmentId === enrollmentId,
    );
    if (!healthPlan) return { canActivate: true, message: "Not activated" };
    if (healthPlan.status === "active")
      return { canActivate: false, message: "Plan already active" };
    if (healthPlan.status === "pending")
      return { canActivate: false, message: "Activation in progress" };
    if (healthPlan.status === "failed")
      return { canActivate: true, message: "Activation failed - retry" };
    return { canActivate: true, message: "Ready to activate" };
  };

  const handleActivateClick = async (
    e: React.MouseEvent,
    enrollment: Enrollment,
  ) => {
    e.stopPropagation();
    setIsLoading(true);
    await handleActivatePlan(enrollment.id);
    setIsLoading(false);
  };

  const enhancedColumns = React.useMemo(() => {
    const actionColumn = columns.find((col) => col.id === "actions");
    if (actionColumn) {
      const updatedColumn = {
        ...actionColumn,
        cell: ({ row }: { row: Row<Enrollment> }) => {
          const { canActivate } = getPlanActivationStatus(row.original.id);
          return canActivate &&
            row.original.status === "active" &&
            row.original.paymentStatus === "paid" ? (
            <Button
              variant="ghost"
              size="sm"
              className="bg-teal-500 p-2 text-white hover:bg-teal-600"
              onClick={(e) => handleActivateClick(e, row.original)}
              disabled={isLoading}
            >
              {isLoading ? "Activating..." : "Activate"}
            </Button>
          ) : null;
        },
      };
      return columns.map((col) => (col.id === "actions" ? updatedColumn : col));
    }
    return columns;
  }, [columns, isLoading]);

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    manualPagination: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const loweredFilter = filterValue.toLowerCase();
      const value = row.getValue(columnId);
      if (typeof value === "string")
        return value.toLowerCase().includes(loweredFilter);
      else if (typeof value === "number")
        return String(value).includes(loweredFilter);
      else if (value instanceof Date)
        return value.toLocaleDateString().includes(loweredFilter);
      return false;
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleActivatePlan = async (enrollmentId: number) => {
    const toastId = toast.loading("Activating plan...");
    try {
      const response = await fetch(`/api/activate-plan/${enrollmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Plan activated successfully!", { id: toastId });
        setIsDetailsOpen(false);
        if (onPlanActivation) onPlanActivation();
      } else if (response.status === 202 || response.status === 409) {
        toast.info(`${result.error}`, { id: toastId, duration: 5000 });
      } else {
        toast.error(`Activation failed: ${result.error || "Unknown error"}`, {
          id: toastId,
          duration: 5000,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error occurred";
      toast.error(`Error: ${errorMessage}`, { id: toastId, duration: 5000 });
    }
  };

  const handleRowsPerPageChange = (value: string) => {
    setPagination(() => ({
      pageIndex: 0,
      pageSize: parseInt(value),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Preloader isLoading={true} />
      </div>
    );
  }

  const paginatedRows = table.getRowModel().rows;

  const renderMobileView = () => (
    <div className="grid grid-cols-1 gap-4">
      {paginatedRows.length ? (
        paginatedRows.map((row) => (
          <div
            key={row.id}
            className="cursor-pointer rounded-lg border bg-primary-foreground p-4 shadow-sm transition-shadow hover:shadow-md"
            onClick={() => handleRowClick(row.original)}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium text-teal-700">
                {row.getValue("firstName")} {row.getValue("lastName")}
              </h3>
              {getPlanActivationStatus(row.original.id).canActivate &&
                row.original.status.toUpperCase() === "ACTIVE" &&
                row.original.paymentStatus === "paid" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-teal-500 p-2 text-white hover:bg-teal-600"
                    onClick={(e) => handleActivateClick(e, row.original)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Activating..." : "Activate"}
                  </Button>
                )}
            </div>
            {/* Rest of mobile view content remains the same */}
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-gray-500">Plan:</span>
              <span className="font-medium text-teal-700">
                {row.getValue("plan")}
              </span>
              <span className="text-gray-500">Status:</span>
              <Badge
                className={`${row.getValue("status") === "active" ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-800"} w-fit`}
              >
                {(row.getValue("status") as string).toUpperCase()}
              </Badge>
              <span className="text-gray-500">Amount:</span>
              <span className="font-medium">
                ₦{(row.getValue("amount") as number).toLocaleString("en-NG")}
              </span>
              <span className="text-gray-500">Payment:</span>
              <Badge
                className={`${row.getValue("paymentStatus") === "paid" ? "bg-green-100 text-gray-700" : "bg-amber-100 text-amber-800"} w-fit`}
              >
                {(row.getValue("paymentStatus") as string).toLocaleUpperCase()}
              </Badge>
            </div>
          </div>
        ))
      ) : (
        <div className="p-8 text-center text-gray-500">No results found.</div>
      )}
    </div>
  );

  const pageCount = table.getPageCount();
  const currentPage = pagination.pageIndex + 1;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = pagination.pageIndex * pagination.pageSize + 1;
  const endRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalRows,
  );

  return (
    <div className="space-y-4">
      {/* Search and filter controls remain unchanged */}
      <div className="flex flex-col items-start justify-between gap-4 py-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm flex-1 sm:w-auto">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search enrollments..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full border-input pl-8 focus-visible:ring-ring"
          />
        </div>
        <div className="flex w-full items-center space-x-2 sm:w-auto">
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={handleRowsPerPageChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 rows</SelectItem>
              <SelectItem value="10">10 rows</SelectItem>
              <SelectItem value="20">20 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Filter className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(
                  (column) => column.id !== "actions" && column.id !== "gender",
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === "durationLabel"
                      ? "Duration"
                      : column.id.replace(/([A-Z])/g, " $1").trim()}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isMobile ? (
        renderMobileView()
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-secondary">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-border hover:bg-muted"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="font-semibold text-primary"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {paginatedRows.length ? (
                paginatedRows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer border-border transition-colors duration-200 hover:bg-muted"
                    onClick={() => handleRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleFlatColumns().length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination controls remain unchanged */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {totalRows > 0
            ? `Showing ${startRow}-${endRow} of ${totalRows}`
            : "No results"}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border text-foreground hover:bg-muted hover:text-primary"
          >
            Previous
          </Button>
          <div className="xs:block hidden text-sm text-muted-foreground">
            Page {currentPage} of {pageCount || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border text-foreground hover:bg-muted hover:text-primary"
          >
            Next
          </Button>
        </div>
      </div>

      {selectedEnrollment && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto bg-primary-foreground p-6 text-primary sm:max-w-lg md:max-w-2xl lg:max-w-3xl">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-4 text-xl font-bold text-primary">
                  Enrollment Details
                </h3>
                <div className="space-y-3">
                  <div className="mb-4 space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                      <p className="font-medium text-muted-foreground">Name:</p>
                      <p className="font-medium">
                        {selectedEnrollment.firstName}{" "}
                        {selectedEnrollment.lastName}
                      </p>
                      <p className="font-medium text-muted-foreground">
                        Email:
                      </p>
                      <p className="overflow-hidden overflow-ellipsis break-words text-sm sm:text-base">
                        {selectedEnrollment.email}
                      </p>
                      <p className="font-medium text-muted-foreground">
                        Phone:
                      </p>
                      <p>{selectedEnrollment.phone}</p>
                      <p className="font-medium text-muted-foreground">
                        Gender:
                      </p>
                      <p>{selectedEnrollment.gender}</p>
                    </div>
                  </div>
                  <div className="mb-4 space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Plan Details
                    </h4>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                      <p className="font-medium text-muted-foreground">Plan:</p>
                      <p>{selectedEnrollment.plan}</p>
                      <p className="font-medium text-muted-foreground">
                        Duration:
                      </p>
                      <p>{getDurationLabel(selectedEnrollment.duration)}</p>
                      <p className="font-medium text-muted-foreground">
                        Amount:
                      </p>
                      <p className="font-semibold">
                        ₦{selectedEnrollment.amount.toLocaleString("en-NG")}
                      </p>
                      <p className="font-medium text-muted-foreground">
                        Enrolled On:
                      </p>
                      <p>{formatDate(selectedEnrollment.createdAt)}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Status Information
                    </h4>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                      <p className="font-medium text-muted-foreground">
                        Payment Status:
                      </p>
                      <Badge
                        className={`justify-self-start ${selectedEnrollment.paymentStatus === "paid" ? "bg-green-300 text-slate-900" : "bg-amber-100 text-amber-800"}`}
                      >
                        {selectedEnrollment.paymentStatus?.toLocaleUpperCase()}
                      </Badge>
                      <p className="font-medium text-muted-foreground">
                        Status:
                      </p>
                      <Badge
                        className={`justify-self-start ${selectedEnrollment.status === "active" ? "bg-green-300 text-slate-900" : "bg-muted text-muted-foreground"}`}
                      >
                        {selectedEnrollment.status?.toLocaleUpperCase()}
                      </Badge>
                      {selectedEnrollment.status === "active" && (
                        <>
                          <p className="font-medium text-muted-foreground">
                            Plan Status:
                          </p>
                          <p className="text-sm">
                            {
                              getPlanActivationStatus(selectedEnrollment.id)
                                ?.message
                            }
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  {selectedEnrollment.status === "active" &&
                    selectedEnrollment.paymentStatus === "paid" &&
                    getPlanActivationStatus(selectedEnrollment.id)
                      .canActivate && (
                      <Button
                        className="mt-6 w-full bg-teal-500 font-bold text-white hover:bg-teal-600"
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsLoading(true);
                          handleActivatePlan(selectedEnrollment.id).then(() =>
                            setIsLoading(false),
                          );
                        }}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Activating...
                          </span>
                        ) : (
                          "Activate Plan"
                        )}
                      </Button>
                    )}
                </div>
              </div>
              <div className="flex flex-col items-center justify-start">
                <div className="w-full max-w-[300px] overflow-hidden rounded-md border-2 border-border shadow-md">
                  <div className="relative aspect-square w-full">
                    <Image
                      src={
                        selectedEnrollment.headshotUrl ||
                        "/placeholder.svg?height=300&width=300"
                      }
                      alt={`${selectedEnrollment.firstName || "User"} ${selectedEnrollment.lastName || "Profile"}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
