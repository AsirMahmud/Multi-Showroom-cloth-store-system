"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PageHeader, MetricCard, DataPanel } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Search,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CreditCard,
  Phone,
  Mail,
  AlertCircle,
  ChevronRight,
  Filter,
  Download,
  Wallet,
  ArrowUpRight,
  UserCheck,
  CheckCircle2,
  TrendingDown,
  Loader2,
  History,
  FileText
} from "lucide-react";
import { useDueSales } from "@/hooks/queries/use-sales";
import { addPayment } from "@/lib/api/sales";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { Sale } from "@/types/sales";
import { cn, formatCurrency } from "@/lib/utils";

const CHART_COLORS = ["#163625", "#2a6646", "#E4FCD5", "#f59e0b", "#ef4444"];

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

export default function DueSalesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedCustomerSales, setSelectedCustomerSales] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showCustomerSalesDialog, setShowCustomerSalesDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { sales: salesData, isLoading } = useDueSales({
    page_size: 1000,
  });

  const dueSales = useMemo(() => {
    if (!salesData) return [];
    
    return salesData.filter((sale: Sale) => {
      const amountDue = parseFloat(sale.amount_due?.toString() || "0") || 0;
      if (amountDue <= 0) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesInvoice = sale.invoice_number?.toLowerCase().includes(searchLower);
        const customer = typeof sale.customer === 'object' ? sale.customer : null;
        const matchesCustomer = customer?.first_name?.toLowerCase().includes(searchLower) ||
                               customer?.last_name?.toLowerCase().includes(searchLower) ||
                               sale.customer_phone?.toLowerCase().includes(searchLower);
        if (!matchesInvoice && !matchesCustomer) return false;
      }
      
      const customerId = typeof sale.customer === 'object' ? sale.customer?.id : sale.customer;
      if (selectedCustomer && selectedCustomer !== "all" && selectedCustomer !== customerId?.toString()) {
        return false;
      }
      
      if (timeFilter !== "all") {
        const dateString = sale.date || sale.created_at;
        if (!dateString) return false;
        const saleDate = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - saleDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (timeFilter) {
          case "week":
            if (diffDays > 7) return false;
            break;
          case "month":
            if (diffDays > 30) return false;
            break;
          case "quarter":
            if (diffDays > 90) return false;
            break;
        }
      }
      
      return true;
    });
  }, [salesData, searchTerm, selectedCustomer, timeFilter]);

  const analytics = useMemo(() => {
    const totalDue = dueSales.reduce((sum, sale) => {
      const amount = parseFloat(sale.amount_due?.toString() || '0') || 0;
      return sum + amount;
    }, 0);
    const totalSales = dueSales.length;
    const uniqueCustomers = new Set(
      dueSales.map((sale) => {
        const id = typeof sale.customer === 'object' ? sale.customer?.id : sale.customer;
        return id ?? 'unknown';
      })
    ).size;
    
    const monthlyData = dueSales.reduce((acc, sale) => {
      const date = new Date((sale.date ?? sale.created_at) || '');
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, amount: 0, count: 0 };
      }
      acc[monthKey].amount += parseFloat(sale.amount_due?.toString() || '0') || 0;
      acc[monthKey].count += 1;
      return acc;
    }, {} as Record<string, { month: string; amount: number; count: number }>);

    const ageAnalysis = dueSales.reduce((acc, sale) => {
      const saleDate = new Date((sale.date ?? sale.created_at) || '');
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let ageGroup = "";
      if (diffDays <= 7) ageGroup = "0-7 Days";
      else if (diffDays <= 30) ageGroup = "8-30 Days";
      else if (diffDays <= 60) ageGroup = "31-60 Days";
      else ageGroup = "60+ Days";
      
      if (!acc[ageGroup]) {
        acc[ageGroup] = { name: ageGroup, value: 0, amount: 0 };
      }
      acc[ageGroup].value += 1;
      acc[ageGroup].amount += parseFloat(sale.amount_due?.toString() || '0') || 0;
      return acc;
    }, {} as Record<string, { name: string; value: number; amount: number }>);

    return {
      totalDue,
      totalSales,
      uniqueCustomers,
      oldestDueDays: dueSales.reduce((maxDays, sale) => {
        const saleDate = new Date((sale.date ?? sale.created_at) || '');
        const diffDays = Math.max(
          0,
          Math.ceil((Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        return Math.max(maxDays, Number.isFinite(diffDays) ? diffDays : 0);
      }, 0),
      monthlyData: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)),
      ageAnalysis: Object.values(ageAnalysis)
    };
  }, [dueSales]);

  const customerGroups = useMemo(() => {
    const groups = dueSales.reduce((acc, sale) => {
      const customerKey = String(
        typeof sale.customer === 'object' ? (sale.customer?.id ?? 'unknown') : (sale.customer ?? 'unknown')
      );
      const customerName = typeof sale.customer === 'object' && sale.customer
        ? `${sale.customer.first_name} ${sale.customer.last_name}`
        : 'Walk-in Customer';
      
      if (!acc[customerKey]) {
        acc[customerKey] = {
          customer: typeof sale.customer === 'object' ? sale.customer : null,
          customerName,
          customerPhone: sale.customer_phone || (typeof sale.customer === 'object' ? sale.customer?.phone : undefined),
          sales: [],
          totalDue: 0,
          oldestSale: sale,
        };
      }
      
      acc[customerKey].sales.push(sale);
      acc[customerKey].totalDue += parseFloat(sale.amount_due?.toString() || '0') || 0;
      
      const currentOldest = new Date((acc[customerKey].oldestSale.date ?? acc[customerKey].oldestSale.created_at) || '');
      const thisSale = new Date((sale.date ?? sale.created_at) || '');
      if (thisSale < currentOldest) {
        acc[customerKey].oldestSale = sale;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(groups).sort((a: any, b: any) => b.totalDue - a.totalDue);
  }, [dueSales]);

  const handleSelectCustomerSales = (customerGroup: any) => {
    setSelectedCustomerSales(customerGroup);
    setShowCustomerSalesDialog(true);
  };

  const handleSelectSaleForPayment = (sale: Sale) => {
    setSelectedSale(sale);
    setShowCustomerSalesDialog(false);
    setPaymentAmount("");
    setPaymentNotes("");
    setPaymentMethod("cash");
  };

  const handleCompletePayment = async () => {
    if (!selectedSale || !paymentAmount) return;
    
    const paymentAmountNum = parseFloat(paymentAmount);
    const amountDue = parseFloat(selectedSale.amount_due?.toString() || '0') || 0;
    
    if (paymentAmountNum <= 0) {
      toast({ title: "Invalid Amount", description: "Payment amount must be greater than 0.", variant: "destructive" });
      return;
    }
    
    if (paymentAmountNum > amountDue) {
      toast({ title: "Amount Too High", description: `Payment amount cannot exceed ${formatCurrency(amountDue)}.`, variant: "destructive" });
      return;
    }
    
    setIsProcessingPayment(true);
    try {
      await addPayment(selectedSale.id!, {
        amount: paymentAmountNum,
        payment_method: paymentMethod as any,
        notes: paymentNotes || `${paymentMethod} payment on due amount`,
        status: 'completed'
      });
      
      toast({ title: paymentAmountNum >= amountDue ? "Payment Completed" : "Partial Payment Processed", description: "Ledger updated successfully." });
      setSelectedSale(null);
      queryClient.invalidateQueries({ queryKey: ['due-sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    } catch (error) {
      toast({ title: "Payment Failed", description: "Failed to process transaction.", variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
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
        title="Payment Orchestration"
        description="Monitor outstanding liabilities, manage debt recovery, and reconcile customer ledgers."
        icon={<Wallet className="h-6 w-6" />}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" className="h-10 rounded-xl border-slate-200 bg-white/50 backdrop-blur-md font-bold text-xs uppercase tracking-widest">
              <Download className="h-3.5 w-3.5 mr-2" /> Financial Audit
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Receivables"
          value={formatCurrency(analytics.totalDue)}
          icon={<DollarSign className="h-5 w-5" />}
          helper={`Across ${analytics.totalSales} outstanding invoices`}
          tone="rose"
        />
        <MetricCard
          label="Debtor Network"
          value={analytics.uniqueCustomers.toString()}
          icon={<Users className="h-5 w-5" />}
          helper="Unique customer entities"
          tone="brand"
        />
        <MetricCard
          label="Avg. Transaction"
          value={formatCurrency(analytics.totalSales > 0 ? analytics.totalDue / analytics.totalSales : 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          helper="Average debt per invoice"
          tone="indigo"
        />
        <MetricCard
          label="Oldest Due Age"
          value={`${analytics.oldestDueDays}d`}
          icon={<History className="h-5 w-5" />}
          helper="Age of the oldest outstanding invoice"
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <DataPanel title="Debt Ledger" description="Granular tracking of all outstanding customer obligations.">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input
                  placeholder="Query Invoice or Customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-10 bg-slate-50 border-none rounded-xl font-bold"
                />
              </div>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="h-12 w-48 bg-slate-50 border-none rounded-xl font-black text-[10px] uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                  <SelectItem value="all" className="font-bold text-[10px] uppercase">All Epochs</SelectItem>
                  <SelectItem value="week" className="font-bold text-[10px] uppercase">Last 7 Cycles</SelectItem>
                  <SelectItem value="month" className="font-bold text-[10px] uppercase">Current Moon</SelectItem>
                  <SelectItem value="quarter" className="font-bold text-[10px] uppercase">Quarterly Alpha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {customerGroups.map((group: any) => (
                  <motion.div
                    key={group.customer?.id || 'unknown'}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group border-t-4 border-t-red-500"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-brand-primary font-black text-xs uppercase">
                          {group.customerName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-brand-primary uppercase tracking-tighter truncate max-w-[120px]">{group.customerName}</h3>
                          <div className="flex items-center text-[10px] font-bold text-slate-400">
                            <Phone className="h-2.5 w-2.5 mr-1" /> {group.customerPhone || "Unlisted"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-red-600">{formatCurrency(group.totalDue)}</div>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-none text-[8px] font-black uppercase tracking-widest px-1.5 py-0">
                          {group.sales.length} Invoices
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {group.sales.slice(0, 2).map((sale: Sale) => (
                        <div key={sale.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-transparent hover:border-brand-primary/10 transition-colors">
                          <div>
                            <div className="text-[10px] font-black text-brand-primary uppercase">{sale.invoice_number}</div>
                            <div className="text-[9px] font-bold text-slate-400">{new Date(sale.date || sale.created_at || "").toLocaleDateString()}</div>
                          </div>
                          <div className="text-[11px] font-black text-slate-600">{formatCurrency(sale.amount_due || 0)}</div>
                        </div>
                      ))}
                      {group.sales.length > 2 && (
                        <div className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest pt-1">+{group.sales.length - 2} Additional Units</div>
                      )}
                    </div>

                    <Button 
                      onClick={() => group.sales.length === 1 ? handleSelectSaleForPayment(group.sales[0]) : handleSelectCustomerSales(group)}
                      className="w-full h-10 bg-brand-primary text-brand-secondary hover:bg-brand-primary/90 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/10"
                    >
                      <CreditCard className="h-3 w-3 mr-2" /> {group.sales.length === 1 ? "Reconcile Unit" : "Batch Reconciliation"}
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </DataPanel>
        </div>

        <div className="space-y-8">
          <DataPanel title="Aging Matrix" description="Liquidity depth analysis by chronological delay.">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.ageAnalysis}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {analytics.ageAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} className="stroke-none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {analytics.ageAnalysis.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{entry.name}</span>
                    <span className="text-xs font-black text-brand-primary">{formatCurrency(entry.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </DataPanel>

          <DataPanel title="Temporal Trends" description="Monthly liability flow indicators.">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#E4FCD5', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    formatter={(value) => formatCurrency(Number(value))} 
                  />
                  <Bar dataKey="amount" fill="#163625" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DataPanel>
        </div>
      </div>

      {/* Customer Sales Dialog */}
      <Dialog open={showCustomerSalesDialog} onOpenChange={setShowCustomerSalesDialog}>
        <DialogContent className="max-w-2xl rounded-[32px] border-none shadow-2xl overflow-hidden p-0 bg-white">
          <DialogHeader className="p-8 bg-brand-primary text-brand-secondary">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Unit Selection Protocol</DialogTitle>
            <DialogDescription className="text-emerald-100/70 text-[10px] font-black uppercase tracking-widest">
              Multiple outstanding liabilities detected for {selectedCustomerSales?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {selectedCustomerSales?.sales.map((sale: Sale) => (
              <div 
                key={sale.id}
                onClick={() => handleSelectSaleForPayment(sale)}
                className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-brand-primary uppercase tracking-tighter">{sale.invoice_number}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Date: {new Date(sale.date || sale.created_at || "").toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-red-600">{formatCurrency(parseFloat(sale.amount_due?.toString() || '0') || 0)}</p>
                  <Button size="sm" className="bg-brand-primary text-brand-secondary font-black text-[9px] uppercase h-8 px-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">Reconcile</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reconcile Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl overflow-hidden p-0 bg-white">
          <DialogHeader className="p-8 bg-brand-primary text-brand-secondary">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Reconciliation</DialogTitle>
                <DialogDescription className="text-emerald-100/70 text-[10px] font-black uppercase tracking-widest">
                  Processing unit {selectedSale?.invoice_number}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payload</p>
                <p className="text-lg font-black text-brand-primary">{formatCurrency(selectedSale?.total || 0)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Active Liability</p>
                <p className="text-lg font-black text-red-600">{formatCurrency(parseFloat(selectedSale?.amount_due?.toString() || '0') || 0)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reconciliation Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-10 h-14 rounded-2xl bg-slate-50 border-none text-lg font-black text-brand-primary"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-9 rounded-xl font-black text-[9px] uppercase border-slate-100 text-slate-400 hover:text-brand-primary"
                    onClick={() => setPaymentAmount((parseFloat(selectedSale?.amount_due?.toString() || '0') / 2).toFixed(2))}
                  >
                    50% Split
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-9 rounded-xl font-black text-[9px] uppercase border-slate-100 text-slate-400 hover:text-brand-primary"
                    onClick={() => setPaymentAmount((parseFloat(selectedSale?.amount_due?.toString() || '0')).toFixed(2))}
                  >
                    Full Balance
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Instrument</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-black text-[10px] uppercase tracking-widest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="cash" className="font-bold text-[10px] uppercase">Physical Cash</SelectItem>
                    <SelectItem value="card" className="font-bold text-[10px] uppercase">Digital Terminal</SelectItem>
                    <SelectItem value="mobile" className="font-bold text-[10px] uppercase">Mobile Vector</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reconciliation Notes</label>
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold text-xs"
                  placeholder="Internal audit metadata..."
                />
              </div>
            </div>

            <Button 
              onClick={handleCompletePayment}
              disabled={isProcessingPayment || !paymentAmount}
              className="w-full h-14 bg-brand-primary text-brand-secondary hover:bg-brand-primary/90 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20"
            >
              {isProcessingPayment ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authorize Reconciliation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
