"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader, MetricCard, DataPanel } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { 
  Download, 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  Calendar, 
  Filter, 
  ArrowUpDown, 
  Trash2, 
  Crown, 
  Trophy, 
  Medal, 
  Award, 
  Star, 
  Users, 
  TrendingUp, 
  Target, 
  Zap,
  DollarSign,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  useCustomers,
  useActiveCustomers,
  useSearchCustomers,
  useDeleteCustomer,
  usePermanentDeleteCustomer,
  useBulkDeleteCustomers,
  useCustomerAnalytics,
} from "@/hooks/queries/use-customer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteAllCustomers } from "@/lib/api/customer";
import { TopCustomersAnalysis } from "@/components/customers/top-customers-analysis";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  total_sales: number;
  sales_count: number;
  last_sale_date: string | null;
  is_active: boolean;
  ranking?: number;
  is_top_customer?: boolean;
};

const rankingIcons = [
  { icon: Crown, color: "text-yellow-500", bgColor: "bg-yellow-100", label: "Top 5" },
  { icon: Trophy, color: "text-gray-500", bgColor: "bg-gray-100", label: "Top 10" },
  { icon: Medal, color: "text-amber-600", bgColor: "bg-amber-100", label: "Top 20" },
  { icon: Award, color: "text-blue-500", bgColor: "bg-blue-100", label: "Top 30" },
  { icon: Star, color: "text-purple-500", bgColor: "bg-purple-100", label: "Top 50" },
];

const getRankingIcon = (ranking: number) => {
  if (ranking <= 5) return rankingIcons[0];
  if (ranking <= 10) return rankingIcons[1];
  if (ranking <= 20) return rankingIcons[2];
  if (ranking <= 30) return rankingIcons[3];
  if (ranking <= 50) return rankingIcons[4];
  if (ranking <= 100) return { icon: Users, color: "text-green-500", bgColor: "bg-green-100", label: "Top 100" };
  return null;
};

const columns: ColumnDef<Customer>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "ranking",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Rank
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const ranking = row.getValue("ranking") as number;
      
      if (!ranking) return "-";
      
      const rankingIcon = getRankingIcon(ranking);
      
      if (rankingIcon) {
        const IconComponent = rankingIcon.icon;
        return (
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-full ${rankingIcon.bgColor}`}>
              <IconComponent className={`h-4 w-4 ${rankingIcon.color}`} />
            </div>
            <Badge variant="secondary" className="text-xs">
              #{ranking}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {rankingIcon.label}
            </span>
          </div>
        );
      }
      
      return (
        <Badge variant="outline" className="text-xs">
          #{ranking}
        </Badge>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = `${row.original.first_name} ${row.original.last_name}`;
      const isTopCustomer = row.original.is_top_customer;
      
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={`https://avatar.vercel.sh/${row.original.id}`}
              alt={name}
            />
            <AvatarFallback>
              {name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <Link
              href={`/customers/${row.original.id}`}
              className="font-medium hover:underline"
            >
              {name}
            </Link>
            {isTopCustomer && (
              <Crown className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "total_sales",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Total Sales
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("total_sales"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return formatted;
    },
  },
  {
    accessorKey: "sales_count",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Sales Count
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "last_sale_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Last Sale
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("last_sale_date");
      return date ? new Date(date as string).toLocaleDateString() : "No sales";
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("is_active") as boolean;
      return (
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
            status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {status ? "Active" : "Inactive"}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;
      const permanentDeleteCustomer = usePermanentDeleteCustomer();
      const { toast } = useToast();

      const handlePermanentDeleteCustomer = async (customerId: number) => {
        try {
          await permanentDeleteCustomer.mutateAsync(customerId);
          toast({
            title: "Success",
            description: "Customer permanently deleted",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to delete customer",
            variant: "destructive",
          });
        }
      };

      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/customers/${customer.id}`}>View</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  customer and all associated data from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handlePermanentDeleteCustomer(customer.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    },
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("ranking");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  useEffect(() => {
    setDebouncedSearchQuery(debouncedQuery);
    setCurrentPage(1);
  }, [debouncedQuery]);
  
  const apiFilters = useMemo(() => {
    const filters: any = {};
    if (filterBy !== "all") {
      if (filterBy.startsWith("top-")) filters.ranking_filter = filterBy;
      else if (filterBy === "high-value" || filterBy === "low-value") filters.sales_filter = filterBy;
      else if (filterBy === "recent") filters.recent_filter = filterBy;
    }
    if (sortBy) {
      const orderPrefix = sortOrder === "desc" ? "-" : "";
      filters.ordering = `${orderPrefix}${sortBy}`;
    }
    return filters;
  }, [filterBy, sortBy, sortOrder]);
  
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers(currentPage, pageSize, apiFilters);
  const { data: searchResults, isLoading: isLoadingSearch } = useSearchCustomers(debouncedSearchQuery, currentPage, pageSize, apiFilters);
  const { data: analytics, isLoading: isLoadingAnalytics } = useCustomerAnalytics();
  
  const bulkDeleteCustomers = useBulkDeleteCustomers();
  const { toast } = useToast();

  let displayData = customersData;
  let isLoading = isLoadingCustomers;
  
  if (debouncedSearchQuery) {
    displayData = searchResults;
    isLoading = isLoadingSearch;
  }

  const customers = displayData?.results || [];
  const totalItems = displayData?.count || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  if (isLoading && !customers.length) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[24px]" />
          ))}
        </div>
        <Skeleton className="h-[600px] rounded-[32px]" />
      </div>
    );
  }

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).map(
      (index) => customers[parseInt(index)].id
    );

    if (selectedIds.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one customer to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      await bulkDeleteCustomers.mutateAsync(selectedIds);
      setRowSelection({});
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleDeleteAllCustomers = async () => {
    try {
      await deleteAllCustomers();
      toast({
        title: "Success",
        description: "All customers have been deleted successfully",
      });
      // Refresh the customers list
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete all customers",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setRowSelection({});
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setRowSelection({});
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="Customer Management"
        description="Build and maintain strong relationships with your customer base."
        icon={<Users className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button
              asChild
              className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
            >
              <Link href="/customers/new">
                <UserPlus className="h-3.5 w-3.5 mr-2" />
                Add Customer
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-10 px-4 bg-white border-brand-primary/5 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Total Customers"
            value={analytics?.total_customers || 0}
            icon={<Users className="h-5 w-5" />}
            tone="brand"
            helper="+15% vs last month"
            isLoading={isLoadingAnalytics}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Active Base"
            value={analytics?.active_customers || 0}
            icon={<Target className="h-5 w-5" />}
            tone="emerald"
            helper={`${analytics ? Math.round((analytics.active_customers / analytics.total_customers) * 100) : 0}% Engagement`}
            isLoading={isLoadingAnalytics}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Total Revenue"
            value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(analytics?.total_sales || 0)}
            icon={<DollarSign className="h-5 w-5" />}
            tone="brand"
            helper="Cumulative LTV"
            isLoading={isLoadingAnalytics}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Avg Order Value"
            value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(analytics?.average_order_value || 0)}
            icon={<Zap className="h-5 w-5" />}
            tone="indigo"
            helper="Spend per visit"
            isLoading={isLoadingAnalytics}
          />
        </motion.div>
      </div>

      {/* Top Customers Analysis */}
      <TopCustomersAnalysis />

      <motion.div variants={item}>
        <DataPanel
          title="Customer List"
          description="Manage your customer relationships and view purchase history."
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                type="search"
                placeholder="Search name, email, or phone..."
                className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-bold text-sm placeholder:text-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-[180px] h-11 bg-slate-50 border-none rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-brand-primary/5">
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="recent">Recent Customers</SelectItem>
                  <SelectItem value="high-value">High Value</SelectItem>
                  <SelectItem value="low-value">Low Value</SelectItem>
                  <SelectItem value="top-20">Top 20</SelectItem>
                  <SelectItem value="top-100">Top 100</SelectItem>
                </SelectContent>
              </Select>
              {Object.keys(rowSelection).length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20">
                      Delete ({Object.keys(rowSelection).length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-black text-brand-primary">Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500 font-medium">
                        Permanently delete {Object.keys(rowSelection).length} customers? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        className="bg-rose-500 hover:bg-rose-600 rounded-xl font-bold"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={customers || []}
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
          <div className="mt-6">
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </DataPanel>
      </motion.div>

      <div className="flex justify-start gap-3 mt-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="h-10 text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs uppercase tracking-widest">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete All Database
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black text-brand-primary">Nuclear Option</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 font-medium">
                Wipe all customers? This is irreversible and will delete all associated transaction history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl font-bold">Safety On</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAllCustomers}
                className="bg-rose-500 hover:bg-rose-600 rounded-xl font-bold"
              >
                Wipe Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}
