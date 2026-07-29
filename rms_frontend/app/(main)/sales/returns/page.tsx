"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { PageHeader, MetricCard, DataPanel } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCcw, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Download,
  Plus,
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle as XIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useReturns } from "@/hooks/queries/use-sales";
import { format } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";
import { Return, ReturnStatus } from "@/types/sales";

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

export default function SalesReturnsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);

  const { returns, isLoading, approveReturn, rejectReturn, isApproving, isRejecting } = useReturns();

  const filteredReturns = useMemo(() => {
    if (!returns) return [];
    return returns.filter((ret: Return) => {
      const matchesSearch = 
        ret.return_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ret.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ret.sale_invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ret.sale_customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || ret.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [returns, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    if (!returns) return { total: 0, pending: 0, approved: 0, value: 0 };
    return {
      total: returns.length,
      pending: returns.filter(r => r.status === 'pending').length,
      approved: returns.filter(r => r.status === 'approved' || r.status === 'completed').length,
      value: returns.reduce((acc, r) => acc + (r.refund_amount || 0), 0)
    };
  }, [returns]);

  const getStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[10px] uppercase tracking-widest">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-none font-black text-[10px] uppercase tracking-widest">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-100 text-rose-800 border-none font-black text-[10px] uppercase tracking-widest">Rejected</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-none font-black text-[10px] uppercase tracking-widest">{status}</Badge>;
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveReturn(id);
    } catch (error) {
      console.error("Failed to approve return:", error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectReturn(id);
    } catch (error) {
      console.error("Failed to reject return:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <Skeleton className="h-[600px] rounded-[32px]" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 p-4 md:p-8">
      <PageHeader
        title="Returns & Refunds"
        description="Oversee the reverse logistics cycle, manage refunds, and audit product returns."
        icon={<RefreshCcw className="h-6 w-6" />}
        actions={
          <div className="flex gap-3">
            <Button asChild className="h-10 rounded-xl bg-brand-primary text-brand-secondary font-bold text-xs uppercase tracking-widest">
              <Link href="/sales/returns/new">
                <Plus className="h-3.5 w-3.5 mr-2" /> New Return
              </Link>
            </Button>
            <Button variant="outline" className="h-10 rounded-xl border-slate-200 bg-white/50 backdrop-blur-md font-bold text-xs uppercase tracking-widest">
              <Download className="h-3.5 w-3.5 mr-2" /> Export Logs
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Liability"
          value={formatCurrency(stats.value)}
          icon={<DollarSign className="h-5 w-5" />}
          tone="rose"
          helper="Total processed refunds"
        />
        <MetricCard
          label="Pending Review"
          value={stats.pending.toString()}
          icon={<Clock className="h-5 w-5" />}
          helper="Returns awaiting approval"
          tone="amber"
        />
        <MetricCard
          label="Execution Rate"
          value={`${Math.round((stats.approved / (stats.total || 1)) * 100)}%`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          helper="Success clearance rate"
          tone="emerald"
        />
        <MetricCard
          label="Total Returns"
          value={stats.total.toString()}
          icon={<RefreshCcw className="h-5 w-5" />}
          helper="All-time return requests"
        />
      </div>

      <motion.div variants={item}>
        <DataPanel 
          title="Returns Ledger" 
          description="Real-time stream of all reverse transactions and status updates."
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                placeholder="Query by return ID, invoice, customer, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-10 bg-slate-50 border-none rounded-xl font-bold"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "ghost"}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                    statusFilter === status ? "bg-brand-primary text-brand-secondary shadow-lg" : "text-slate-400 hover:bg-slate-100"
                  )}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Identifier</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Magnitude</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Context / Reason</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Protocol</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                      No matching records found in the ledger.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReturns.map((ret: Return) => (
                    <TableRow key={ret.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-brand-primary uppercase tracking-tighter">{ret.return_number}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {ret.sale_invoice_number ? `Invoice: ${ret.sale_invoice_number}` : `Sale ID: ${ret.sale}`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-600">{format(new Date(ret.created_at), "MMM dd, yyyy")}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(ret.created_at), "HH:mm:ss")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs font-black text-brand-primary">{formatCurrency(ret.refund_amount)}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="max-w-[200px] truncate">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                            {ret.sale_customer_name ? `${ret.sale_customer_name} · ` : ""}{ret.reason}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(ret.status)}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setSelectedReturn(ret)}
                            className="h-8 w-8 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                          </Button>
                          
                          {ret.status === 'pending' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-2xl">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Procedures</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleApprove(ret.id)} className="text-xs font-bold text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer">
                                  <CheckCircle className="h-3.5 w-3.5 mr-2" /> Approve Refund
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(ret.id)} className="text-xs font-bold text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer">
                                  <XCircle className="h-3.5 w-3.5 mr-2" /> Reject Request
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DataPanel>
      </motion.div>

      {/* Return Detail Dialog */}
      <Dialog open={!!selectedReturn} onOpenChange={(open) => !open && setSelectedReturn(null)}>
        <DialogContent className="max-w-2xl rounded-[32px] border-none shadow-2xl overflow-hidden p-0 bg-white">
          <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Return Inspection</DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deep-dive into reverse transaction {selectedReturn?.return_number}</DialogDescription>
              </div>
              {selectedReturn && getStatusBadge(selectedReturn.status)}
            </div>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block border-b border-slate-100 pb-2">Core Data</Label>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Return ID</span>
                      <span className="text-xs font-black text-brand-primary">{selectedReturn.return_number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Original Sale</span>
                      <span className="text-xs font-black text-brand-primary">#{selectedReturn.sale}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Timestamp</span>
                      <span className="text-xs font-black text-brand-primary">{format(new Date(selectedReturn.created_at), "MMM dd, yyyy HH:mm")}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block border-b border-slate-100 pb-2">Financials</Label>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Refund Value</span>
                      <span className="text-lg font-black text-brand-primary">{formatCurrency(selectedReturn.refund_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                      <span className="text-xs font-black text-slate-500 uppercase">{selectedReturn.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block border-b border-slate-100 pb-2">Reasoning & Diagnostics</Label>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-600 italic leading-relaxed">
                    "{selectedReturn.reason}"
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block border-b border-slate-100 pb-2">Returned Items ({selectedReturn.items?.length || 0})</Label>
                <div className="space-y-2">
                  {selectedReturn.items && selectedReturn.items.length > 0 ? (
                    selectedReturn.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Package className="h-4 w-4 text-slate-300" />
                          </div>
                          <span className="text-xs font-black text-brand-primary">Item ID: {typeof item.sale_item === 'object' ? (item.sale_item as any)?.id : item.sale_item}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-brand-primary">Qty: {item.quantity}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Item Details Specified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setSelectedReturn(null)} 
              className="flex-1 font-black text-[10px] uppercase tracking-widest h-12 rounded-xl"
            >
              Close
            </Button>
            {selectedReturn?.status === 'pending' && (
              <>
                <Button 
                  onClick={() => handleReject(selectedReturn.id)} 
                  variant="destructive"
                  disabled={isRejecting}
                  className="flex-1 font-black text-[10px] uppercase tracking-widest h-12 rounded-xl shadow-lg"
                >
                  Reject Request
                </Button>
                <Button 
                  onClick={() => handleApprove(selectedReturn.id)} 
                  disabled={isApproving}
                  className="flex-1 bg-brand-primary text-brand-secondary font-black text-[10px] uppercase tracking-widest h-12 rounded-xl shadow-lg"
                >
                  Approve Refund
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
