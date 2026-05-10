"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader, MetricCard, DataPanel } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Clock, 
  Download, 
  FileText, 
  Trash2, 
  Loader2, 
  Search, 
  Filter, 
  X, 
  ArrowUpDown, 
  MoreHorizontal, 
  Eye, 
  DollarSign, 
  CheckCircle,
  CreditCard,
  Smartphone,
  Gift,
  Zap,
  FilterIcon,
  Package,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { useSales } from "@/hooks/queries/use-sales";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn, formatCurrency } from "@/lib/utils";
import { Sale, SaleStatus, SaleType, PaymentMethod, SalePayment, SaleItem } from "@/types/sales";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";
import { addPayment } from "@/lib/api/sales";

// The backend returns customer details in a nested object
interface SaleWithCustomerDetails extends Omit<Sale, "customer"> {
  customer?: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  } | null;
}

// Framer motion variants
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

export default function SalesHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "all">("all");
  const [saleTypeFilter, setSaleTypeFilter] = useState<SaleType | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | "all">("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | "unpaid" | "partially_paid" | "fully_paid">("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedOrder, setSelectedOrder] = useState<SaleWithCustomerDetails | null>(null);
  const [selectedDuePayment, setSelectedDuePayment] = useState<SaleWithCustomerDetails | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [saleToDelete, setSaleToDelete] = useState<SaleWithCustomerDetails | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    sales,
    pagination,
    isLoading,
    error,
    deleteSale,
    deleteAllSales,
    isDeleting,
    isDeletingAll,
  } = useSales({
    status: statusFilter !== "all" ? statusFilter : undefined,
    sale_type: saleTypeFilter !== "all" ? saleTypeFilter : undefined,
    payment_method: paymentFilter !== "all" ? paymentFilter : undefined,
    payment_status: paymentStatusFilter !== "all" ? paymentStatusFilter : undefined,
    search: debouncedSearchTerm || undefined,
    ordering: sortOrder === "desc" ? `-${sortBy}` : sortBy,
    page,
    page_size: pageSize,
    start_date: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    end_date: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  });

  const typedSales = sales as unknown as SaleWithCustomerDetails[];
  const totalPages = Math.ceil((pagination?.count || 0) / pageSize);

  useEffect(() => {
    setIsSearching(searchTerm !== debouncedSearchTerm);
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, paymentFilter, paymentStatusFilter, debouncedSearchTerm, dateRange]);

  const addPaymentMutation = useMutation({
    mutationFn: ({ saleId, data }: { saleId: number; data: any }) => addPayment(saleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({ title: "Success", description: "Payment processed successfully." });
      setSelectedDuePayment(null);
      setPaymentAmount("");
      setPaymentNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to process payment.", variant: "destructive" });
    }
  });

  const getStatusBadge = (status: SaleStatus) => {
    const configs: Record<SaleStatus, { color: string; label: string }> = {
      completed: { color: "bg-emerald-100 text-emerald-800", label: "Completed" },
      pending: { color: "bg-amber-100 text-amber-800", label: "Pending" },
      partially_paid: { color: "bg-orange-100 text-orange-800", label: "Partially Paid" },
      gifted: { color: "bg-purple-100 text-purple-800", label: "Gifted" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
      refunded: { color: "bg-blue-100 text-blue-800", label: "Refunded" },
    };
    const config = configs[status] || configs.pending;
    return <Badge className={cn("rounded-lg font-bold text-[10px] uppercase tracking-widest border-none shadow-sm", config.color)}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (sale: SaleWithCustomerDetails) => {
    if (sale.status === 'completed') return <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-lg font-bold text-[10px] uppercase tracking-widest">Paid</Badge>;
    if (sale.status === 'gifted') return <Badge className="bg-purple-50 text-purple-600 border-none rounded-lg font-bold text-[10px] uppercase tracking-widest">Gift</Badge>;
    const remaining = Math.max(0, sale.total - (sale.amount_paid || 0));
    if (remaining === 0) return <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-lg font-bold text-[10px] uppercase tracking-widest">Paid</Badge>;
    if (sale.amount_paid && sale.amount_paid > 0) return <Badge className="bg-orange-50 text-orange-600 border-none rounded-lg font-bold text-[10px] uppercase tracking-widest">Part: {formatCurrency(remaining)} Due</Badge>;
    return <Badge className="bg-rose-50 text-rose-600 border-none rounded-lg font-bold text-[10px] uppercase tracking-widest">Unpaid</Badge>;
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash': return <DollarSign className="w-3.5 h-3.5" />;
      case 'card': return <CreditCard className="w-3.5 h-3.5" />;
      case 'mobile':
      case 'mobile_money': return <Smartphone className="w-3.5 h-3.5" />;
      case 'gift': return <Gift className="w-3.5 h-3.5" />;
      case 'split': return <Zap className="w-3.5 h-3.5" />;
      default: return <DollarSign className="w-3.5 h-3.5" />;
    }
  };

  const handleExport = () => {
    const csv = [
      ["Invoice", "Customer", "Date", "Status", "Total", "Paid"].join(","),
      ...typedSales.map(s => [s.invoice_number, s.customer ? `${s.customer.first_name} ${s.customer.last_name}` : "Guest", s.date, s.status, s.total, s.amount_paid].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `sales_history_${Date.now()}.csv`);
  };

  const handleReport = () => {
    const doc = new jsPDF();
    doc.text("Transaction History Report", 14, 16);
    // @ts-ignore
    doc.autoTable({
      head: [["Invoice", "Customer", "Date", "Status", "Total"]],
      body: typedSales.map(s => [s.invoice_number, s.customer ? `${s.customer.first_name} ${s.customer.last_name}` : "Guest", format(new Date(s.date || ""), "PPP"), s.status, formatCurrency(s.total)])
    });
    doc.save(`sales_report_${Date.now()}.pdf`);
  };

  const handleDeleteSaleClick = (sale: SaleWithCustomerDetails) => setSaleToDelete(sale);

  const handleDeleteSale = async () => {
    if (!saleToDelete?.id) return;
    try {
      await deleteSale(saleToDelete.id);
      setSaleToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await deleteAllSales();
      setShowDeleteAllDialog(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewSale = (sale: SaleWithCustomerDetails) => setSelectedOrder(sale);

  const handleMakePayment = () => {
    if (!selectedDuePayment || !paymentAmount) return;
    addPaymentMutation.mutate({
      saleId: selectedDuePayment.id!,
      data: {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        notes: paymentNotes || "Manual payment from history",
        status: 'completed'
      }
    });
  };

  if (isLoading && !typedSales.length) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
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

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="Transaction History"
        description="Comprehensive ledger of all retail transactions, orders, and payment statuses."
        icon={<Clock className="h-6 w-6" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-10 px-4 bg-white border-brand-primary/5 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary hover:bg-slate-50"
              onClick={handleExport}
              disabled={isLoading}
            >
              <Download className="w-3.5 h-3.5 mr-2 text-slate-400" />
              Export
            </Button>
            <DatePickerWithRange value={dateRange} onChange={setDateRange} />
            <Button
              className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
              onClick={handleReport}
              disabled={isLoading}
            >
              <FileText className="w-3.5 h-3.5 mr-2" />
              Report
            </Button>
            <Button
              variant="destructive"
              className="h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20"
              onClick={() => setShowDeleteAllDialog(true)}
              disabled={isLoading || isDeletingAll}
            >
              {isDeletingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span className="ml-2">Wipe</span>
            </Button>
          </div>
        }
      />

      <motion.div variants={item}>
        <DataPanel title="Refine Search" description="Filter by status, payment method, or customer details.">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                placeholder="Search invoice, customer name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-bold text-sm placeholder:text-slate-300"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary">
                <SelectValue placeholder="Sale Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-primary/5">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatusFilter} onValueChange={(v) => setPaymentStatusFilter(v as any)}>
              <SelectTrigger className="h-11 bg-slate-50 border-none rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-primary/5">
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="fully_paid">Fully Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {debouncedSearchTerm && (
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 text-emerald-500" />}
              {pagination?.count || 0} Results for "{debouncedSearchTerm}"
            </div>
          )}
        </DataPanel>
      </motion.div>

      <motion.div variants={item}>
        <DataPanel title="Transaction Ledger" description={`Showing ${sales.length} of ${pagination?.count || 0} transactions.`}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Method</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-400 font-bold text-sm uppercase tracking-widest">No records found</TableCell>
                  </TableRow>
                ) : (
                  typedSales.map((sale) => (
                    <TableRow key={sale.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell><span className="text-xs font-black text-brand-primary">#{sale.invoice_number}</span></TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{sale.customer ? `${sale.customer.first_name} ${sale.customer.last_name}` : "Guest"}</span>
                          <span className="text-[10px] font-bold text-slate-400">{sale.customer_phone || sale.customer?.phone || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-700">{format(new Date(sale.date || ""), "MMM dd, yyyy")}</span>
                          <span className="text-[10px] font-bold text-slate-400">{format(new Date(sale.date || ""), "HH:mm")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            {getPaymentMethodIcon(sale.payment_method)}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{sale.payment_method}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-brand-primary">{formatCurrency(sale.total)}</span>
                          <span className="text-[9px] font-bold text-emerald-600">Paid: {formatCurrency(sale.amount_paid || 0)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(sale.status || 'pending')}
                          {getPaymentStatusBadge(sale)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-white">
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-brand-primary/5 shadow-xl">
                            <DropdownMenuItem onClick={() => handleViewSale(sale)} className="font-bold text-xs uppercase tracking-widest text-slate-600"><Eye className="h-3.5 w-3.5 mr-2" /> View</DropdownMenuItem>
                            {(sale.amount_due || 0) > 0 && (
                              <DropdownMenuItem onClick={() => setSelectedDuePayment(sale)} className="font-bold text-xs uppercase tracking-widest text-emerald-600"><DollarSign className="h-3.5 w-3.5 mr-2" /> Pay Due</DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDeleteSaleClick(sale)} className="font-bold text-xs uppercase tracking-widest text-rose-500"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} className={cn("rounded-xl font-bold text-[10px] uppercase tracking-widest", page === 1 && "pointer-events-none opacity-50")} />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1} className={cn("rounded-xl font-bold text-[10px]", page === i + 1 && "bg-brand-primary text-brand-secondary")}>{i + 1}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => setPage(p => Math.min(totalPages, p + 1))} className={cn("rounded-xl font-bold text-[10px] uppercase tracking-widest", page === totalPages && "pointer-events-none opacity-50")} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </DataPanel>
      </motion.div>

      {/* Payment Dialog */}
      <Dialog open={!!selectedDuePayment} onOpenChange={() => setSelectedDuePayment(null)}>
        <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-brand-primary uppercase tracking-tight">Resolve Balance</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Process payment for invoice #{selectedDuePayment?.invoice_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-brand-primary/5 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Outstanding</span>
              <span className="text-lg font-black text-rose-500">{formatCurrency(selectedDuePayment?.amount_due || 0)}</span>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Amount</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-brand-primary/5" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-brand-primary/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleMakePayment} disabled={addPaymentMutation.isPending} className="w-full h-12 bg-brand-primary text-brand-secondary rounded-xl font-bold text-xs uppercase tracking-widest">
              {addPaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
              Confirm Settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sale Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          {selectedOrder && (
            <div className="flex flex-col">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-brand-primary">Invoice #{selectedOrder.invoice_number}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{format(new Date(selectedOrder.date || ""), "PPPP")}</p>
                </div>
                {getStatusBadge(selectedOrder.status || 'pending')}
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</span>
                    <div className="flex flex-col"><span className="text-sm font-bold text-slate-700">{selectedOrder.customer ? `${selectedOrder.customer.first_name} ${selectedOrder.customer.last_name}` : "Guest"}</span></div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment</span>
                    <div className="flex flex-col"><span className="text-sm font-bold text-slate-700">{selectedOrder.payment_method}</span></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ledger Details</span>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: SaleItem, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-700">{item.product?.name || "Product"} × {item.quantity}</span>
                        <span className="text-xs font-black text-brand-primary">{formatCurrency(item.total || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-700">Total Settlement</span>
                  <span className="text-xl font-black text-brand-primary">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!saleToDelete} onOpenChange={() => setSaleToDelete(null)}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-brand-primary">Nuclear Delete?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">This is irreversible. Invoice #{saleToDelete?.invoice_number} will be expunged.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSale} className="bg-rose-500 hover:bg-rose-600 rounded-xl font-bold">Wipe Record</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-brand-primary">Wipe Entire View?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">This will clear ALL records in the current ledger view. Continue?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-rose-500 hover:bg-rose-600 rounded-xl font-bold">Wipe Ledger</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
