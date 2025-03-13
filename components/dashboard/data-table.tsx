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
  CellContext,
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
import { HealthPlan } from "./columns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Preloader from "@/components/preloader";
import { Search, Filter, ExternalLink } from "lucide-react";
import { Download } from "lucide-react";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData extends HealthPlan>({
  columns,
  data,
}: DataTableProps<TData, any>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    gender: false,
    phone: false,
  });
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isHospitalOpen, setIsHospitalOpen] = useState(false);
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<HealthPlan | null>(null);
  const [renewalDuration, setRenewalDuration] = useState("12");
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

  // Handle row click for details, ensuring it doesn't interfere with action menu
  const handleRowClick = (
    enrollment: HealthPlan,
    event: React.MouseEvent<HTMLElement>,
  ) => {
    const target = event.target as HTMLElement;
    // Ignore clicks originating from the renew button
    if (target.closest(".renew-button")) return;
    setSelectedEnrollment(enrollment);
    setIsDetailsOpen(true);
    setIsImageOpen(false); // Ensure other dialogs are closed
    setIsHospitalOpen(false);
    setIsRenewalOpen(false);
  };

  // Handle view hospital list from details dialog
  const handleViewHospitalList = () => {
    setIsDetailsOpen(false);
    setIsHospitalOpen(true);
  };

  // Handle renew button click with event stopping
  const handleRenewClick = (
    event: React.MouseEvent,
    enrollment: HealthPlan,
  ) => {
    event.stopPropagation(); // Stop the row click event from firing
    setSelectedEnrollment(enrollment);
    setIsRenewalOpen(true);
  };

  // Handle renewal submission
  const handleRenewalSubmit = () => {
    // Here you would handle the renewal logic
    console.log(
      `Renewing plan for ${selectedEnrollment?.name} for ${renewalDuration} months`,
    );
    // Close the renewal modal
    setIsRenewalOpen(false);
  };

  // View ID Card from details dialog
  const handleViewIdCard = () => {
    setIsDetailsOpen(false);
    setIsImageOpen(true);
  };

  const enhancedColumns = React.useMemo(() => {
    // Find and replace the actions column with a renew button column
    return columns.map((col) => {
      if (col.id === "actions") {
        return {
          ...col,
          header: "Renew",
          cell: (props: CellContext<TData, any>) => (
            <Button
              variant="outline"
              className="renew-button h-8 w-full bg-teal-500 text-white hover:bg-teal-600"
              onClick={(e) =>
                handleRenewClick(e, props.row.original as HealthPlan)
              }
            >
              Renew
            </Button>
          ),
        };
      }
      return col;
    });
  }, [columns]);

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
      if (typeof value === "string") {
        return value.toLowerCase().includes(loweredFilter);
      } else if (typeof value === "number") {
        return String(value).includes(loweredFilter);
      } else if (value instanceof Date) {
        return value.toLocaleDateString().includes(loweredFilter);
      }
      return false;
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleRowsPerPageChange = (value: string) => {
    const newPageSize = parseInt(value);
    setPagination(() => ({
      pageIndex: 0,
      pageSize: newPageSize,
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
            onClick={(e) => handleRowClick(row.original, e)}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium text-teal-700">
                {row.getValue("firstName")} {row.getValue("lastName")}
              </h3>
              <Button
                variant="outline"
                className="renew-button h-8 bg-teal-500 text-white hover:bg-teal-600"
                onClick={(e) => handleRenewClick(e, row.original)}
              >
                Renew
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-gray-500">Email:</span>
              <span className="w-30 overflow-hidden text-ellipsis whitespace-nowrap font-medium text-teal-700">
                {row.getValue("email")}
              </span>
              <span className="text-gray-500">HMO ID:</span>
              <span className="font-medium">
                {row.getValue("providerPolicyId") || "N/A"}
              </span>
              <span className="text-gray-500">Start Date:</span>
              <span className="font-medium">
                {formatDate(row.getValue("startDate"))}
              </span>
              <span className="text-gray-500">Status:</span>
              <Badge
                className={`${
                  row.getValue("expired")
                    ? "bg-gray-100 text-gray-800"
                    : "bg-teal-100 text-teal-800"
                } w-fit`}
              >
                {row.getValue("expired") ? "Expired" : "Active"}
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
                    onClick={(e) => handleRowClick(row.original, e)}
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {totalRows > 0 ? (
            <>
              Showing {startRow}-{endRow} of {totalRows}
            </>
          ) : (
            <>No results</>
          )}
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
        <>
          {/* ID Card Dialog */}
          <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
            <DialogContent className="sm:max-w-md md:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Health Plan ID Card
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative h-auto max-h-[60vh] w-full overflow-hidden rounded-md border">
                  <Image
                    src={
                      selectedEnrollment.idCardUrl ?? "/placeholder-image.jpg"
                    }
                    alt="Health Plan ID"
                    className="object-contain"
                    height={600}
                    width={800}
                  />
                </div>
                <Button
                  className="flex w-full items-center gap-2 sm:w-auto"
                  asChild
                >
                  <a href={selectedEnrollment.idCardUrl ?? "#"} download>
                    <Download className="h-4 w-4" />
                    <span>Download ID Card</span>
                  </a>
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Hospital List Dialog */}
          <Dialog open={isHospitalOpen} onOpenChange={setIsHospitalOpen}>
            <DialogContent className="max-w-[90vw] overflow-hidden p-0 sm:max-w-2xl md:max-w-4xl lg:max-w-5xl">
              <DialogHeader className="border-b p-4 sm:p-6">
                <DialogTitle className="text-xl font-semibold">
                  Network Hospitals
                </DialogTitle>
              </DialogHeader>
              <div className="relative w-full">
                <iframe
                  src={selectedEnrollment.hospitalListUrl}
                  className="h-[50vh] w-full sm:h-[60vh] md:h-[70vh]"
                  title="Hospital List"
                />
              </div>
              <div className="flex justify-end border-t p-4">
                <Button variant="outline" asChild>
                  <a
                    href={selectedEnrollment.hospitalListUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open in New Tab</span>
                  </a>
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Health Plan Details Dialog */}
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="sm:max-w-md md:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Health Plan Details
                </DialogTitle>
              </DialogHeader>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-medium">
                      {selectedEnrollment.providerPolicyId}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          selectedEnrollment.expired
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {selectedEnrollment.expired ? "Expired" : "Active"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Member Name</p>
                    <p className="font-medium">{selectedEnrollment.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedEnrollment.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedEnrollment.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {formatDate(selectedEnrollment.startDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {formatDate(selectedEnrollment.endDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Enrolled On</p>
                    <p className="font-medium">
                      {formatDate(selectedEnrollment.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="mb-2 text-sm text-muted-foreground">ID Card</p>
                  <div className="relative h-auto w-full overflow-hidden rounded-md border">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={
                          selectedEnrollment.idCardUrl ??
                          "/placeholder-image.jpg"
                        }
                        alt="Health Plan ID"
                        className="object-contain"
                        fill
                        sizes="(max-width: 768px) 100vw, 500px"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 sm:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-none"
                      onClick={handleViewIdCard}
                    >
                      View Full Size
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="flex-1 sm:flex-none"
                    >
                      <a
                        href={selectedEnrollment.idCardUrl ?? "#"}
                        download
                        className="flex items-center justify-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Added View Hospital List button */}
                <div className="border-t pt-4">
                  <Button
                    onClick={handleViewHospitalList}
                    variant="outline"
                    className="w-full"
                  >
                    View Hospital List
                  </Button>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  onClick={() => setIsDetailsOpen(false)}
                  variant="outline"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setIsRenewalOpen(true);
                  }}
                  className="bg-teal-500 text-white hover:bg-teal-600"
                >
                  Renew Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Renewal Modal */}
          <Dialog open={isRenewalOpen} onOpenChange={setIsRenewalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Renew Health Plan
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {selectedEnrollment.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Policy ID: {selectedEnrollment.providerPolicyId}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Plan Ends
                    </p>
                    <p className="font-medium">
                      {formatDate(selectedEnrollment.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      className={`${
                        selectedEnrollment.expired
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {selectedEnrollment.expired ? "Expired" : "Active"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium">Select Renewal Duration</p>
                  <Select
                    value={renewalDuration}
                    onValueChange={setRenewalDuration}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Month</SelectItem>
                      <SelectItem value="3">3 Months</SelectItem>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm">
                    By renewing this plan, coverage will be extended from{" "}
                    <span className="font-medium">
                      {formatDate(selectedEnrollment.endDate)}
                    </span>{" "}
                    for{" "}
                    <span className="font-medium">
                      {renewalDuration}{" "}
                      {parseInt(renewalDuration) === 1 ? "month" : "months"}
                    </span>
                    .
                  </p>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  onClick={() => setIsRenewalOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRenewalSubmit}
                  className="bg-teal-500 text-white hover:bg-teal-600"
                >
                  Confirm Renewal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
