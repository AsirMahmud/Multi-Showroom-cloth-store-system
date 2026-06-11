"use client";

import { useState, useMemo } from "react";
import { 
  DollarSign, 
  ShoppingCart, 
  Wallet, 
  TrendingUp, 
  Filter, 
  Calendar, 
  Users, 
  Target 
} from "lucide-react";
import { PageHeader, MetricCard, DataPanel } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { motion } from "framer-motion";
import { 
  AreaChart, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Area, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { useDashboardStats } from "@/hooks/queries/use-sales";
import { formatCurrency } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

interface SalesTrendDataPoint {
  date: string;
  sales: number;
  profit: number;
  orders: number;
}

interface PaymentMethodDataPoint {
  method: string;
  count: number;
  total: number;
}

interface SalesByHourDataPoint {
  hour: number;
  count: number;
  total: number;
}

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

export default function SalesOverview() {
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "90d">("7d");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const {
    data: stats,
    isLoading,
    error,
  } = useDashboardStats({
    period: timeFilter,
    status: status || undefined,
    payment_method: paymentMethod || undefined,
    customer_phone: customerPhone || undefined,
    start_date: dateRange.from
      ? dateRange.from.toISOString().slice(0, 10)
      : undefined,
    end_date: dateRange.to
      ? dateRange.to.toISOString().slice(0, 10)
      : undefined,
  });

  const metrics = useMemo(() => ({
    monthlyNetSales: stats?.monthly.net_sales || 0,
    monthlyGrossSales: stats?.monthly.gross_sales || 0,
    monthlyReturns: stats?.monthly.returns_total || 0,
    totalOrders: stats?.monthly.total_transactions || 0,
    totalProfit: stats?.monthly.total_profit || 0,
    totalDiscount: stats?.monthly.total_discount || 0,
    avgTransactionValue: stats?.monthly.average_transaction_value || 0,
    totalCustomers: stats?.monthly.total_customers || 0,
    todayNetSales: stats?.today.net_sales || 0,
    todayReturns: stats?.today.returns_total || 0,
    todayOrders: stats?.today.total_transactions || 0,
    todayProfit: stats?.today.total_profit || 0,
    todayCustomers: stats?.today.total_customers || 0,
  }), [stats]);

  const salesTrendData = useMemo<SalesTrendDataPoint[]>(() => {
    if (!stats?.sales_trend) return [];
    return stats.sales_trend.map((item) => ({
      date: item.date__date,
      sales: item.sales,
      profit: item.profit,
      orders: item.orders,
    }));
  }, [stats?.sales_trend]);

  const paymentMethodData = useMemo<PaymentMethodDataPoint[]>(() => {
    if (!stats?.payment_method_distribution) return [];
    return stats.payment_method_distribution.map((item) => ({
      method: item.payment_method,
      count: item.count,
      total: item.total,
    }));
  }, [stats?.payment_method_distribution]);

  const salesByHourData = useMemo<SalesByHourDataPoint[]>(() => {
    if (!stats?.sales_by_hour) return [];
    return stats.sales_by_hour.filter(
      (item) => item.count > 0 || item.total > 0
    );
  }, [stats?.sales_by_hour]);

  if (isLoading) {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-[32px]" />
          <Skeleton className="h-[400px] rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-xl rounded-3xl border border-brand-primary/5 shadow-premium">
        <p className="text-lg font-bold text-rose-500">Error loading sales data</p>
        <p className="text-slate-500 mt-2">{error.message}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-6">Try Again</Button>
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
        title="Sales Analytics"
        description="Comprehensive analysis of your revenue, transactions, and customer behavior."
        icon={<TrendingUp className="h-6 w-6" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Select
              value={timeFilter}
              onValueChange={(value: "7d" | "30d" | "90d") => setTimeFilter(value)}
            >
              <SelectTrigger className="w-40 h-10 bg-white border-brand-primary/5 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary">
                <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-primary/5">
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-10 px-4 bg-white border-brand-primary/5 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary hover:bg-slate-50"
              onClick={() => setAdvancedOpen(true)}
            >
              <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
              Filters
            </Button>
          </div>
        }
      />

      {/* Advanced Filter Modal */}
      <Dialog open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <DialogContent className="p-8 w-full max-w-md space-y-6 rounded-[32px] border-none shadow-2xl">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-brand-primary tracking-tight">Advanced Filters</h2>
            <p className="text-sm text-slate-400 font-medium">Refine your analytics data view.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-full h-11 bg-slate-50 border-none rounded-xl font-bold text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-brand-primary/5">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Method</label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-full h-11 bg-slate-50 border-none rounded-xl font-bold text-sm">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-brand-primary/5">
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Customer Phone</label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="01XXX XXXXXX"
                className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date Range</label>
              <DatePickerWithRange value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold text-slate-400" onClick={() => setAdvancedOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 h-12 rounded-xl font-bold bg-brand-primary text-brand-secondary hover:bg-emerald-900 shadow-lg shadow-brand-primary/20" onClick={() => setAdvancedOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Today's Net Sales"
            value={formatCurrency(metrics.todayNetSales)}
            icon={<DollarSign className="h-5 w-5" />}
            tone="brand"
            helper={`${formatCurrency(metrics.todayReturns)} returned today`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Today's Orders"
            value={metrics.todayOrders}
            icon={<ShoppingCart className="h-5 w-5" />}
            tone="emerald"
            helper="Transactions today"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Monthly Net Sales"
            value={formatCurrency(metrics.monthlyNetSales)}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="brand"
            helper={`${formatCurrency(metrics.monthlyGrossSales)} gross sales`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Approved Returns"
            value={formatCurrency(metrics.monthlyReturns)}
            icon={<Wallet className="h-5 w-5" />}
            tone="indigo"
            helper="Subtracted from monthly sales"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <DataPanel
            title="Top Products"
            description="Best performing inventory items"
          >
            <div className="space-y-3">
              {stats?.top_products?.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:bg-white hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand-primary text-brand-secondary rounded-xl flex items-center justify-center font-black text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-brand-primary">{product.product__name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {product.total_quantity} Units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-brand-primary">
                      {formatCurrency(product.total_revenue)}
                    </p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      +{formatCurrency(product.total_profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </DataPanel>
        </motion.div>

        <motion.div variants={item}>
          <DataPanel
            title="Top Customers"
            description="Highest lifetime value customers"
          >
            <div className="space-y-3">
              {stats?.customer_analytics?.top_customers?.map((customer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:bg-white hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand-secondary text-brand-primary rounded-xl flex items-center justify-center font-black text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-brand-primary">{customer.customer_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {customer.visit_count} Visits
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-brand-primary">
                      {formatCurrency(customer.total_spent)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      LTV
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </DataPanel>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <DataPanel
            title="Sales Trend"
            description="Daily net sales after approved returns"
          >
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesTrendData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#163625" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#163625" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                      fontWeight: 700,
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Net Sales"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#163625"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DataPanel>
        </motion.div>

        <motion.div variants={item}>
          <DataPanel
            title="Payment Methods"
            description="Transaction volume by channel"
          >
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="total"
                  >
                    {paymentMethodData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                      fontWeight: 700,
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </DataPanel>
        </motion.div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item}>
          <MetricCard
            label="New Customers"
            value={stats?.customer_analytics?.new_customers_today || 0}
            icon={<Users className="h-5 w-5" />}
            tone="brand"
            helper="Acquired today"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Active Today"
            value={stats?.customer_analytics?.active_customers_today || 0}
            icon={<Users className="h-5 w-5" />}
            tone="emerald"
            helper="Transacting now"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Retention Rate"
            value={`${stats?.customer_analytics?.customer_retention_rate?.toFixed(1) || 0}%`}
            icon={<Target className="h-5 w-5" />}
            tone="indigo"
            helper="Customer loyalty"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
