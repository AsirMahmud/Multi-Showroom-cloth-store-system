"use client";

import { PageHeader, MetricCard, DataPanel } from "@/components/ui/professional";
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
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useDashboard } from "@/hooks/queries/use-dashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

const COLORS = [
  "#163625", // brand-primary
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // rose-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function DashboardContent() {
  const { data: stats, isLoading, error, refetch } = useDashboard();
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <Skeleton className="h-14 w-64 rounded-2xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-[450px] rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-xl rounded-3xl border border-brand-primary/5 shadow-premium">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h3 className="text-2xl font-bold text-brand-primary">Failed to load dashboard</h3>
        <p className="text-slate-500 mt-2">There was an error connecting to the business servers.</p>
        <Button onClick={() => refetch()} variant="ghost" className="mt-8 gap-2 bg-brand-primary text-brand-secondary hover:bg-brand-primary/90 px-8 h-12 rounded-xl transition-all shadow-lg shadow-brand-primary/20">
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  if (!stats || !isClient) {
    return null;
  }

  // Safe data access with fallbacks
  const safeStats = {
    today: {
      sales: stats.today?.sales || 0,
      expenses: stats.today?.expenses || 0,
    },
    monthly: {
      sales: stats.monthly?.sales || 0,
      expenses: stats.monthly?.expenses || 0,
    },
    counts: {
      customers: stats.counts?.customers || 0,
      products: stats.counts?.products || 0,
      suppliers: stats.counts?.suppliers || 0,
    },
    sales_trend: Array.isArray(stats.sales_trend) ? stats.sales_trend : [],
    expense_trend: Array.isArray(stats.expense_trend)
      ? stats.expense_trend
      : [],
    top_products: Array.isArray(stats.top_products) ? stats.top_products : [],
    expense_categories: Array.isArray(stats.expense_categories)
      ? stats.expense_categories.filter((cat) => cat.amount !== null)
      : [],
    low_stock_items: Array.isArray(stats.low_stock_items)
      ? stats.low_stock_items
      : [],
    recent_suppliers: Array.isArray(stats.recent_suppliers)
      ? stats.recent_suppliers
      : [],
  };

  return (
    <motion.div
      className="space-y-10"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <PageHeader
        title="Business Dashboard"
        description="Comprehensive overview of your real-time performance and analytics."
        icon={<TrendingUp className="h-6 w-6" />}
        actions={
          <Button
            onClick={() => refetch()}
            variant="ghost"
            className="h-12 px-6 gap-2 bg-white/50 backdrop-blur-md border border-brand-primary/5 rounded-xl hover:bg-white transition-all shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="font-bold text-brand-primary">Sync Data</span>
          </Button>
        }
      />

      {/* Primary Metrics */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={item}
      >
        <MetricCard
          label="Today's Sales"
          value={formatCurrency(safeStats.today.sales)}
          icon={<DollarSign className="h-5 w-5" />}
          tone="brand"
          helper={
            <div className="flex items-center gap-1 text-emerald-600 font-bold">
              <ArrowUpRight className="h-3 w-3" />
              <span>Real-time revenue</span>
            </div>
          }
        />

        <MetricCard
          label="Today's Expenses"
          value={formatCurrency(safeStats.today.expenses)}
          icon={<TrendingDown className="h-5 w-5" />}
          tone="rose"
          helper={
            <div className="flex items-center gap-1 text-rose-500 font-bold">
              <ArrowDownRight className="h-3 w-3" />
              <span>Daily outgoings</span>
            </div>
          }
        />

        <MetricCard
          label="Monthly Sales"
          value={formatCurrency(safeStats.monthly.sales)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="emerald"
          helper={
            <div className="flex items-center gap-1 text-emerald-600 font-bold">
              <ArrowUpRight className="h-3 w-3" />
              <span>Current period</span>
            </div>
          }
        />

        <MetricCard
          label="Monthly Expenses"
          value={formatCurrency(safeStats.monthly.expenses)}
          icon={<TrendingDown className="h-5 w-5" />}
          tone="amber"
          helper={
            <div className="flex items-center gap-1 text-amber-600 font-bold">
              <ArrowDownRight className="h-3 w-3" />
              <span>Period total</span>
            </div>
          }
        />
      </motion.div>

      {/* Business Counts */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={item}
      >
        <MetricCard
          label="Total Customers"
          value={safeStats.counts.customers}
          icon={<Users className="h-5 w-5" />}
          tone="blue"
          helper="Verified registrations"
        />

        <MetricCard
          label="Total Products"
          value={safeStats.counts.products}
          icon={<Package className="h-5 w-5" />}
          tone="slate"
          helper="Active inventory count"
        />

        <MetricCard
          label="Total Suppliers"
          value={safeStats.counts.suppliers}
          icon={<Truck className="h-5 w-5" />}
          tone="brand"
          helper="Partner network"
        />
      </motion.div>

      {/* Charts Row 1 - Sales vs Expenses */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        variants={item}
      >
        <DataPanel
          title="Sales Performance"
          description="Daily sales revenue trends across the current period."
          className="shadow-premium"
          actions={<Calendar className="h-5 w-5 text-brand-primary/20" />}
        >
          <div className="h-[350px] w-full">
            {safeStats.sales_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeStats.sales_trend}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#163625" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#163625" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date__date"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      value
                        ? new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : ""
                    }
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(22, 54, 37, 0.05)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    cursor={{fill: 'rgba(22, 54, 37, 0.02)'}}
                  />
                  <Bar
                    dataKey="total"
                    fill="url(#salesGradient)"
                    name="Sales"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No performance data found
              </div>
            )}
          </div>
        </DataPanel>

        <DataPanel
          title="Expense Analytics"
          description="Detailed breakdown of operational expenditures."
          className="shadow-premium"
          actions={<TrendingDown className="h-5 w-5 text-rose-300" />}
        >
          <div className="h-[350px] w-full">
            {safeStats.expense_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safeStats.expense_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      value
                        ? new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : ""
                    }
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(22, 54, 37, 0.05)",
                      borderRadius: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#ef4444"
                    strokeWidth={4}
                    dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No expense data available
              </div>
            )}
          </div>
        </DataPanel>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        variants={item}
      >
        <DataPanel
          title="Top Products"
          description="Best selling items by volume."
          className="shadow-premium"
          actions={<ShoppingCart className="h-5 w-5 text-blue-400" />}
        >
          <div className="h-[300px] w-full">
            {safeStats.top_products.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeStats.top_products}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  />
                  <Bar dataKey="total_sales" fill="#163625" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No product distribution
              </div>
            )}
          </div>
        </DataPanel>

        <DataPanel
          title="Expense Distribution"
          description="Allocation across categories."
          className="shadow-premium"
          actions={<TrendingDown className="h-5 w-5 text-rose-400" />}
        >
          <div className="h-[300px] w-full">
            {safeStats.expense_categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeStats.expense_categories.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {safeStats.expense_categories.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No category data
              </div>
            )}
          </div>
        </DataPanel>

        <DataPanel
          title="Stock Alerts"
          description="Items below minimum threshold."
          className="shadow-premium"
          actions={<AlertTriangle className="h-5 w-5 text-amber-500" />}
        >
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {safeStats.low_stock_items.length > 0 ? (
              safeStats.low_stock_items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50 hover:bg-rose-50 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-sm text-rose-600 font-medium">
                        Only {item.stock_quantity} left
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                <Package className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">Stock levels are healthy</p>
              </div>
            )}
          </div>
        </DataPanel>
      </motion.div>

      {/* Active Suppliers */}
      <motion.div variants={item} className="pb-10">
        <DataPanel
          title="Active Suppliers"
          description="Reliable partners currently integrated with your supply chain."
          className="shadow-premium"
          actions={<Truck className="h-5 w-5 text-brand-primary/20" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeStats.recent_suppliers.length > 0 ? (
              safeStats.recent_suppliers.map((supplier, index) => (
                <div
                  key={index}
                  className="p-5 bg-white rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-brand-secondary text-brand-primary rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Truck className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-brand-primary truncate">{supplier.name}</p>
                      <p className="text-sm text-slate-500 truncate">{supplier.phone}</p>
                    </div>
                  </div>
                  <div className="mt-5 pt-5 border-t border-slate-50 space-y-2">
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {supplier.email}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-10 text-center text-slate-400">
                No active suppliers found
              </div>
            )}
          </div>
        </DataPanel>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
