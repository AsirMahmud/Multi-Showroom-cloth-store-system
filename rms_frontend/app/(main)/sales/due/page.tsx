"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  TrendingDown,
  Clock,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  ChevronRight,
  Filter,
  Download,
  Wallet,
  ArrowUpRight,
  UserCheck
} from "lucide-react";
import { useDueSales } from "@/hooks/queries/use-sales";
import { addPayment } from "@/lib/api/sales";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { Sale } from "@/types/sales";
import { formatCurrency } from "@/lib/utils";

interface ExpandedSale extends Omit<Sale, 'customer'> {
  customer?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  } | null;
}

const CHART_COLORS = ["#163625", "#2a6646", "#E4FCD5", "#f59e0b", "#ef4444"];

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

  // Fetch due sales data (any sale with amount_due > 0 regardless of status)
  const { sales: salesData, isLoading } = useDueSales({
    page_size: 1000,
  });

  // Filter and process due sales data
  const dueSales = useMemo(() => {
    if (!salesData) return [];
    
    return salesData.filter((sale: Sale) => {
      // Additional frontend filtering for due sales
      const isUnpaid = sale.amount_due && sale.amount_due > 0;
      const isPending = sale.status === 'pending';
      
      if (!isUnpaid && !isPending) return false;
      
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesInvoice = sale.invoice_number?.toLowerCase().includes(searchLower);
        const customer = typeof sale.customer === 'object' ? sale.customer : null;
        const matchesCustomer = customer?.first_name?.toLowerCase().includes(searchLower) ||
                               customer?.last_name?.toLowerCase().includes(searchLower) ||
                               sale.customer_phone?.toLowerCase().includes(searchLower);
        if (!matchesInvoice && !matchesCustomer) return false;
      }
      
      // Apply customer filter
      const customerId = typeof sale.customer === 'object' ? sale.customer?.id : sale.customer;
      if (selectedCustomer && selectedCustomer !== "all" && selectedCustomer !== customerId?.toString()) {
        return false;
      }
      
      // Apply time filter
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

  // Calculate analytics data
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
    
    // Monthly due analysis
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

    // Age analysis
    const ageAnalysis = dueSales.reduce((acc, sale) => {
      const saleDate = new Date((sale.date ?? sale.created_at) || '');
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let ageGroup = "";
      if (diffDays <= 7) ageGroup = "0-7 days";
      else if (diffDays <= 30) ageGroup = "8-30 days";
      else if (diffDays <= 60) ageGroup = "31-60 days";
      else ageGroup = "60+ days";
      
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
      monthlyData: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)),
      ageAnalysis: Object.values(ageAnalysis)
    };
  }, [dueSales]);

  // Group sales by customer
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
      
      // Track oldest sale
      const currentOldest = new Date((acc[customerKey].oldestSale.date ?? acc[customerKey].oldestSale.created_at) || '');
      const thisSale = new Date((sale.date ?? sale.created_at) || '');
      if (thisSale < currentOldest) {
        acc[customerKey].oldestSale = sale;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(groups).sort((a: any, b: any) => b.totalDue - a.totalDue);
  }, [dueSales]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    if (paymentAmountNum > amountDue) {
      toast({
        title: "Amount Too High",
        description: `Payment amount cannot exceed the due amount of ${formatCurrency(amountDue)}.`,
        variant: "destructive",
      });
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
      
      const isCompletePayment = paymentAmountNum >= amountDue;
      
      toast({
        title: isCompletePayment ? "Payment Completed" : "Partial Payment Processed",
        description: isCompletePayment 
          ? `Payment of ${formatCurrency(paymentAmountNum)} completed. Sale status updated.`
          : `Partial payment of ${formatCurrency(paymentAmountNum)} processed. Remaining due: ${formatCurrency(amountDue - paymentAmountNum)}.`,
      });
      
      setSelectedSale(null);
      setPaymentAmount("");
      setPaymentNotes("");
      setPaymentMethod("cash");
      
      queryClient.invalidateQueries({ queryKey: ['due-sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-[#E4FCD5]/10 to-[#163625]/5 p-6 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-[#E4FCD5]/10 to-[#163625]/5 p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#163625] to-[#2a6646] bg-clip-text text-transparent flex items-center gap-3">
            <Wallet className="h-8 w-8 text-[#163625]" />
            Payment Management
          </h1>
          <p className="text-lg text-slate-600">
            Track outstanding dues, process customer payments, and monitor aging debt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="bg-white border-slate-200 shadow-sm hover:bg-slate-50 text-[#163625]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Dues List
          </Button>
          <Button className="bg-[#163625] hover:bg-[#1a402d] shadow-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Debt Reports
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<DollarSign className="h-6 w-6" />}
          label="Total Outstanding"
          value={formatCurrency(analytics.totalDue)}
          description={`Across ${analytics.totalSales} transactions`}
          variant="destructive"
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          label="Pending Count"
          value={analytics.totalSales.toString()}
          description="Incomplete payments"
          variant="default"
        />
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Customers in Debt"
          value={analytics.uniqueCustomers.toString()}
          description="Unique debtors"
          variant="default"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Avg. Due Amount"
          value={formatCurrency(analytics.totalSales > 0 ? analytics.totalDue / analytics.totalSales : 0)}
          description="Per transaction avg"
          variant="default"
        />
      </div>

      {/* Filters and Search - Upgraded Card */}
      <Card className="bg-white border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#163625]" />
            <CardTitle className="text-lg text-[#163625]">Search & Filter Payments</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Search Invoice/Customer</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Time Period</label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Specific Customer</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customerGroups.map((group: any) => (
                    <SelectItem 
                      key={group.customer?.id || 'unknown'} 
                      value={group.customer?.id?.toString() || 'unknown'}
                    >
                      {group.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setTimeFilter("all");
                  setSelectedCustomer("all");
                }}
                className="w-full border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts - Redesigned Tabs */}
      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="bg-white p-1 rounded-xl shadow-md border border-slate-100">
          <TabsTrigger value="monthly" className="rounded-lg px-6 data-[state=active]:bg-[#163625] data-[state=active]:text-white">Monthly Trends</TabsTrigger>
          <TabsTrigger value="aging" className="rounded-lg px-6 data-[state=active]:bg-[#163625] data-[state=active]:text-white">Aging Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard title="Monthly Due Amount" description="Trend of outstanding amounts by month">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    cursor={{fill: '#E4FCD5', opacity: 0.4}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value) => formatCurrency(Number(value))} 
                  />
                  <Bar dataKey="amount" fill="#163625" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Outstanding Transactions" description="Volume of due sales per month">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Line type="monotone" dataKey="count" stroke="#163625" strokeWidth={3} dot={{fill: '#163625', strokeWidth: 2, r: 4}} activeDot={{r: 6, strokeWidth: 0}} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="aging" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard title="Due Age Distribution" description="Customer volume by debt age">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.ageAnalysis}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.ageAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {analytics.ageAnalysis.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full" style={{backgroundColor: CHART_COLORS[index % CHART_COLORS.length]}}></div>
                    <span className="text-xs font-medium text-slate-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Financial Impact by Age" description="Total dollar amount aging over time">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.ageAnalysis} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                  <Tooltip 
                    cursor={{fill: '#E4FCD5', opacity: 0.4}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value) => formatCurrency(Number(value))} 
                  />
                  <Bar dataKey="amount" fill="#2a6646" radius={[0, 6, 6, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Dues Section - Upgraded Grid */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#163625]">Dues by Customer</h2>
            <p className="text-slate-500 font-medium">{customerGroups.length} customers with outstanding balances</p>
          </div>
        </div>

        {customerGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-xl border-2 border-dashed border-slate-100">
            <UserCheck className="h-16 w-16 text-emerald-100 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Outstanding Dues</h3>
            <p className="text-slate-500 max-w-sm text-center">
              {searchTerm || selectedCustomer || timeFilter !== "all" 
                ? "No matching records found for your current search criteria."
                : "All balances are settled. Your customer list is currently clean!"}
            </p>
            {(searchTerm || selectedCustomer || timeFilter !== "all") && (
              <Button variant="link" className="mt-2 text-[#163625]" onClick={() => {
                setSearchTerm("");
                setTimeFilter("all");
                setSelectedCustomer("all");
              }}>Clear All Filters</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {customerGroups.map((group: any) => (
              <Card key={group.customer?.id || 'unknown'} className="border-0 shadow-xl bg-white overflow-hidden group hover:translate-y-[-4px] transition-all duration-300 border-t-4 border-t-red-500">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#E4FCD5] flex items-center justify-center text-[#163625] font-bold text-xs uppercase">
                          {group.customerName.charAt(0)}
                        </div>
                        <CardTitle className="text-lg text-[#163625] truncate max-w-[140px]">{group.customerName}</CardTitle>
                      </div>
                      <div className="flex flex-col gap-1 mt-2">
                        {group.customerPhone && (
                          <div className="flex items-center text-xs text-slate-500 font-medium">
                            <Phone className="h-3 w-3 mr-1.5 opacity-60" />
                            {group.customerPhone}
                          </div>
                        )}
                        {group.customer?.email && (
                          <div className="flex items-center text-xs text-slate-500 font-medium">
                            <Mail className="h-3 w-3 mr-1.5 opacity-60" />
                            {group.customer.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600 mb-1">{formatCurrency(group.totalDue)}</p>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 text-[10px] px-1.5 py-0">
                        {group.sales.length} Sales
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Oldest Invoice</span>
                      <span>{formatDate((group.oldestSale.date ?? group.oldestSale.created_at) || new Date().toISOString())}</span>
                    </div>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                      {group.sales.map((sale: Sale) => (
                        <div key={sale.id} className="flex justify-between items-center text-xs bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm group/item hover:border-[#163625]/20 transition-colors">
                          <div className="flex-1">
                            <div className="font-bold text-[#163625] flex items-center gap-1.5">
                              {sale.invoice_number}
                              {sale.status === 'pending' && <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div>}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                               {formatDate((sale.date ?? sale.created_at) || new Date().toISOString())}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-700">{formatCurrency(parseFloat(sale.amount_due?.toString() || '0') || 0)}</div>
                            <button 
                              onClick={() => handleSelectSaleForPayment(sale)}
                              className="text-[10px] font-bold text-[#163625] hover:underline flex items-center gap-0.5 ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                              Pay <ArrowUpRight className="h-2 w-2" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-[#163625] hover:bg-[#1a402d] rounded-xl h-10 shadow-lg shadow-[#163625]/10"
                      onClick={() => group.sales.length === 1 ? handleSelectSaleForPayment(group.sales[0]) : handleSelectCustomerSales(group)}
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-2" />
                      {group.sales.length === 1 ? "Collect Payment" : "Process Group Dues"}
                    </Button>
                    <LinkNext href={`/customers/${group.customer?.id}`} className="block">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="rounded-xl h-10 w-10 p-0 border-slate-200"
                      >
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Button>
                    </LinkNext>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Select Sale Dialog for Multi-Sale Customers */}
      <Dialog open={showCustomerSalesDialog} onOpenChange={setShowCustomerSalesDialog}>
        <DialogContent className="max-w-2xl rounded-3xl border-0 shadow-2xl overflow-hidden p-0">
          <DialogHeader className="bg-[#163625] text-white p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Select Sale to Settle</DialogTitle>
                <DialogDescription className="text-emerald-100/70">
                  Multiple outstanding invoices found for {selectedCustomerSales?.customerName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-3">
              {selectedCustomerSales?.sales.map((sale: Sale) => (
                <div 
                  key={sale.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer group"
                  onClick={() => handleSelectSaleForPayment(sale)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#163625]">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#163625]">{sale.invoice_number}</p>
                      <p className="text-xs text-slate-500 font-medium">Issued on {formatDate((sale.date ?? sale.created_at) || '')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600">{formatCurrency(parseFloat(sale.amount_due?.toString() || '0') || 0)}</p>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold opacity-60">{sale.status}</Badge>
                    </div>
                    <Button size="sm" className="bg-[#163625] rounded-full px-4 group-hover:scale-105 transition-transform">Pay</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Processing Dialog - High Fidelity */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-md rounded-3xl border-0 shadow-2xl overflow-hidden p-0">
          <DialogHeader className="bg-[#163625] text-white p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#E4FCD5]/20 flex items-center justify-center text-[#E4FCD5]">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl">Collect Payment</DialogTitle>
                <DialogDescription className="text-emerald-100/70">
                  Processing dues for {selectedSale?.invoice_number}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Bill</p>
                <p className="text-lg font-bold text-[#163625]">{formatCurrency(selectedSale?.total || 0)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Amount Due</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(parseFloat(selectedSale?.amount_due?.toString() || '0') || 0)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Payment Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-9 h-12 rounded-xl bg-slate-50 border-slate-200 text-lg font-bold"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-xs font-bold text-[#163625] bg-[#E4FCD5]/30 hover:bg-[#E4FCD5]/50 rounded-lg h-8"
                    onClick={() => setPaymentAmount(((parseFloat(selectedSale?.amount_due?.toString() || '0') || 0) / 2).toFixed(2))}
                  >
                    Pay Half
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-xs font-bold text-white bg-[#163625] hover:bg-[#1a402d] rounded-lg h-8"
                    onClick={() => setPaymentAmount((parseFloat(selectedSale?.amount_due?.toString() || '0') || 0).toFixed(2))}
                  >
                    Full Payment
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="cash" className="rounded-lg">Cash Payment</SelectItem>
                    <SelectItem value="card" className="rounded-lg">Card Swipe</SelectItem>
                    <SelectItem value="mobile" className="rounded-lg">Mobile Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Reference Notes</label>
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="E.g. Paid via Bkash/Reference ID"
                  className="rounded-xl border-slate-200 h-10 text-sm"
                />
              </div>

              {paymentAmount && parseFloat(paymentAmount) > 0 && (
                <div className="bg-[#163625]/5 border border-[#163625]/10 rounded-2xl p-4 space-y-1">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-500">Remaining Balance</span>
                    <span className="text-[#163625] font-bold">
                      {formatCurrency(Math.max(0, (parseFloat(selectedSale?.amount_due?.toString() || '0') || 0) - (parseFloat(paymentAmount) || 0)))}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
                    {parseFloat(paymentAmount) >= (parseFloat(selectedSale?.amount_due?.toString() || '0') || 0) 
                      ? "✨ Clears all dues for this sale" 
                      : "📝 Partial payment - will remain in dues list"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 pt-0">
            <Button 
              className="w-full bg-[#163625] hover:bg-[#1a402d] h-14 rounded-2xl text-lg font-bold shadow-xl shadow-[#163625]/20"
              disabled={isProcessingPayment || !paymentAmount}
              onClick={handleCompletePayment}
            >
              {isProcessingPayment ? "Processing..." : "Confirm & Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Components
function StatCard({ icon, label, value, description, variant = "default" }: any) {
  const isDestructive = variant === "destructive";
  return (
    <Card className={`border-0 shadow-xl overflow-hidden group transition-all duration-300 hover:translate-y-[-4px] ${isDestructive ? 'bg-white border-l-4 border-l-red-500' : 'bg-white'}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className={`text-3xl font-black ${isDestructive ? 'text-red-600' : 'text-[#163625]'}`}>{value}</p>
            <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors">{description}</p>
          </div>
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isDestructive ? 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-[#163625] group-hover:text-white'}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, description, children }: any) {
  return (
    <Card className="border-0 shadow-xl bg-white overflow-hidden p-6 space-y-6 transition-all duration-300 hover:shadow-2xl">
      <div>
        <CardTitle className="text-xl text-[#163625]">{title}</CardTitle>
        <CardDescription className="font-medium text-slate-400">{description}</CardDescription>
      </div>
      <div className="pt-2">{children}</div>
    </Card>
  );
}

// Next.js Link component helper
function LinkNext({ href, children, className }: any) {
  const Link = require('next/link').default;
  return <Link href={href} className={className}>{children}</Link>;
}
