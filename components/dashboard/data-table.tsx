/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { HealthPlan } from "./columns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Preloader from "@/components/preloader";
import { Search, Filter, MoreHorizontal } from "lucide-react";
import { Download, ExternalLink } from "lucide-react";
import {
  // Dialog,
  // DialogContent,
  DialogHeader,
  DialogTitle,
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
  DropdownMenuItem,
  DropdownMenuLabel,
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
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<HealthPlan | null>(null);
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
    event: React.MouseEvent<HTMLElement>
  ) => {
    const target = event.target as HTMLElement;
    // Ignore clicks originating from the action menu
    if (target.closest(".action-menu")) return;
    setSelectedEnrollment(enrollment);
    setIsDetailsOpen(true);
    setIsImageOpen(false); // Ensure other dialogs are closed
    setIsHospitalOpen(false);
  };

  // Action menu handlers with event stopping
  const handleActionClick = (
    event: React.MouseEvent,
    enrollment: HealthPlan,
    dialog: "image" | "hospital" | "details"
  ) => {
    event.stopPropagation(); // Stop the row click event from firing
    setSelectedEnrollment(enrollment);
    setIsImageOpen(dialog === "image");
    setIsHospitalOpen(dialog === "hospital");
    setIsDetailsOpen(dialog === "details");
  };

  const enhancedColumns = React.useMemo(() => {
    const actionColumn = columns.find((col) => col.id === "actions");
    if (actionColumn) {
      const updatedColumn = {
        ...actionColumn,
        cell: ({ row }: { row: Row<HealthPlan> }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 action-menu"
                onClick={(e) => e.stopPropagation()} // Stop propagation here too
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => handleActionClick(e, row.original, "image")}
              >
                View ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleActionClick(e, row.original, "hospital")}
              >
                View Hospital List
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleActionClick(e, row.original, "details")}
              >
                View More Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      };
      return columns.map((col) => (col.id === "actions" ? updatedColumn : col));
    }
    return columns;
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
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-primary-foreground"
            onClick={(e) => handleRowClick(row.original, e)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-teal-700">
                {row.getValue("firstName")} {row.getValue("lastName")}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 action-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={(e) => handleActionClick(e, row.original, "image")}
                  >
                    View ID
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) =>
                      handleActionClick(e, row.original, "hospital")
                    }
                  >
                    View Hospital List
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) =>
                      handleActionClick(e, row.original, "details")
                    }
                  >
                    View More Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium text-teal-700 overflow-hidden w-30 whitespace-nowrap text-ellipsis">
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
        <div className="text-center p-8 text-gray-500">No results found.</div>
      )}
    </div>
    // <p>Mobile view</p>
  );

  const pageCount = table.getPageCount();
  const currentPage = pagination.pageIndex + 1;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = pagination.pageIndex * pagination.pageSize + 1;
  const endRow = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalRows
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="relative w-full sm:w-auto flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search enrollments..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-8 border-input focus-visible:ring-ring w-full"
          />
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
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
                  (column) => column.id !== "actions" && column.id !== "gender"
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
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-muted border-border"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-primary font-semibold"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
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
                    className="cursor-pointer hover:bg-muted transition-colors duration-200 border-border"
                    onClick={(e) => handleRowClick(row.original, e)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
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
          <div className="text-sm text-muted-foreground hidden xs:block">
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
          <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
            <DialogContent className="sm:max-w-md md:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Health Plan ID Card
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-full h-auto max-h-[60vh] overflow-hidden rounded-md border">
                  <Image
                    src={
                      selectedEnrollment.idCardUrl ?? "/placeholder-image.jpg"
                    }
                    alt="Health Plan ID"
                    className="object-contain"
                    height={600}
                    width={800}
                    // fill
                    // sizes="(max-width: 768px) 100vw, 700px"
                  />
                </div>
                <Button
                  className="w-full sm:w-auto flex items-center gap-2"
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
            <DialogContent className="max-w-[90vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl p-0 overflow-hidden">
              <DialogHeader className="p-4 sm:p-6 border-b">
                <DialogTitle className="text-xl font-semibold">
                  Network Hospitals
                </DialogTitle>
              </DialogHeader>
              <div className="relative w-full">
                <iframe
                  src={selectedEnrollment.hospitalListUrl}
                  className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh]"
                  title="Hospital List"
                />
              </div>
              <div className="p-4 border-t flex justify-end">
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
              <div className="space-y-4 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
                  <p className="text-sm text-muted-foreground mb-2">ID Card</p>
                  <div className="relative w-full h-auto rounded-md border overflow-hidden">
                    <div className="aspect-[4/3] relative">
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
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={selectedEnrollment.idCardUrl ?? "#"}
                        download
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
