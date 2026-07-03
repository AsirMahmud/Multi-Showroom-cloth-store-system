"use client";

import { useState, useMemo } from "react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, MetricCard, DataPanel, TableSkeleton, GridSkeleton, ChartSkeleton } from "@/components/ui/professional";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalesReport } from "@/components/reports/sales-report";
import { ExpenseReport } from "@/components/reports/expense-report";
import { InventoryReport } from "@/components/reports/inventory-report";
import { CustomerReport } from "@/components/reports/customer-report";
import { CategoryReport } from "@/components/reports/category-report";
import { ProfitLossReport } from "@/components/reports/profit-loss-report";
import { ProductPerformanceReport } from "@/components/reports/product-performance-report";
import { DateRange } from "react-day-picker";
import { useOverviewReport } from "@/hooks/queries/use-reports";
import { PreorderReport } from "@/components/reports/preorder-report";
import { OnlinePreorderAnalytics } from "@/components/reports/online-preorder-analytics";
import { IntegrityReport } from "@/components/reports/integrity-report";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { 
  Calendar, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  ChevronDown, 
  ChevronUp,
  Target,
  Zap,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBranch } from "@/contexts/branch-context";

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

export default function ReportsPage() {
  const { selectedBranchId, availableBranches } = useBranch();
  const activeBranchName = selectedBranchId === null
    ? "All Branches"
    : availableBranches.find((branch) => branch.id === selectedBranchId)?.name || `Branch #${selectedBranchId}`;
  const [selectedFilter, setSelectedFilter] = useState("all-time");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Calculate date range based on selected filter
  const dateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedFilter) {
      case "all-time":
        return {
          from: new Date(0),
          to: now,
        };
      case "today":
        return {
          from: today,
          to: today,
        };
      case "this-week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          from: startOfWeek,
          to: now,
        };
      case "this-month":
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: now,
        };
      case "this-year":
        return {
          from: new Date(now.getFullYear(), 0, 1),
          to: now,
        };
      case "last-7-days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return {
          from: sevenDaysAgo,
          to: now,
        };
      case "last-30-days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return {
          from: thirtyDaysAgo,
          to: now,
        };
      case "last-90-days":
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 90);
        return {
          from: ninetyDaysAgo,
          to: now,
        };
      case "custom":
        return customDateRange;
      default:
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: now,
        };
    }
  }, [selectedFilter, customDateRange]);

  const { data: overviewData, isLoading: isLoadingOverview } =
    useOverviewReport(dateRange);

  const combinedChartData = useMemo(() => {
    if (!overviewData) {
      return [];
    }

    const salesMap = Object.fromEntries(
      overviewData.sales_by_date.map((sale) => [sale.date, parseFloat(sale.total)])
    );
    const expenseMap = Object.fromEntries(
      overviewData.expenses_by_date.map((expense) => [expense.date, parseFloat(expense.total)])
    );
    const allDates = Array.from(
      new Set([...Object.keys(salesMap), ...Object.keys(expenseMap)])
    ).sort();

    return allDates.map((date) => ({
      date,
      sales: salesMap[date] || 0,
      expenses: expenseMap[date] || 0,
    }));
  }, [overviewData]);

  const formattedDateRange = {
    from: dateRange?.from,
    to: dateRange?.to,
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="Business Intelligence"
        description="Unified analytics engine for revenue auditing, procurement delta, and operational scaling."
        icon={<BarChart3 className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-10 rounded-xl border-emerald-200 bg-emerald-50 px-4 text-xs font-black uppercase tracking-wider text-emerald-700">
              {activeBranchName}
            </Badge>
            <Button
            variant="outline"
            className="h-10 px-4 bg-white border-brand-primary/5 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary hover:bg-slate-50"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
            {isFilterExpanded ? "Close Filters" : "Analytics Filters"}
            </Button>
          </div>
        }
      />

      <AnimatePresence>
        {isFilterExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <DataPanel 
              title="Temporal Constraints" 
              description="Define the lifecycle for data aggregation."
            >
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Maximus", value: "all-time", icon: TrendingUp },
                    { label: "Current Cycle", value: "today", icon: Calendar },
                    { label: "Weekly Grid", value: "this-week", icon: TrendingUp },
                    { label: "Monthly Log", value: "this-month", icon: Calendar },
                    { label: "Annual Audit", value: "this-year", icon: TrendingUp },
                    { label: "7D Window", value: "last-7-days", icon: TrendingDown },
                    { label: "30D Window", value: "last-30-days", icon: TrendingDown },
                  ].map((filter) => (
                    <Button
                      key={filter.value}
                      variant={selectedFilter === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFilter(filter.value)}
                      className={cn(
                        "h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300",
                        selectedFilter === filter.value
                          ? "bg-brand-primary text-brand-secondary shadow-lg shadow-brand-primary/20"
                          : "bg-white border-brand-primary/5 text-slate-400 hover:text-brand-primary hover:bg-slate-50"
                      )}
                    >
                      <filter.icon className="h-3.5 w-3.5 mr-2" />
                      {filter.label}
                    </Button>
                  ))}
                </div>

                <div className="pt-4 border-t border-brand-primary/5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Manual Range Entry</label>
                  <DatePickerWithRange
                    value={customDateRange}
                    onChange={(range) => {
                      setCustomDateRange(range || { from: new Date(), to: new Date() });
                      setSelectedFilter("custom");
                    }}
                  />
                </div>
              </div>
            </DataPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="flex w-full bg-white/50 backdrop-blur-xl border border-brand-primary/5 shadow-premium rounded-2xl p-1 h-auto overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: "Executive Sum" },
            { id: "sales", label: "Revenue Ledger" },
            { id: "expenses", label: "Liability Grid" },
            { id: "inventory", label: "SKU Audit" },
            { id: "customers", label: "User Loyalty" },
            { id: "profit-loss", label: "P&L Analysis" },
            { id: "product-performance", label: "Asset Velocity" },
            { id: "preorder", label: "Preorder Engine" },
            { id: "online-preorder", label: "Online Stream" },
            { id: "integrity", label: "Integrity Scan" }
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex-1 min-w-[130px] py-2.5 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap",
                "data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary data-[state=active]:shadow-lg data-[state=active]:shadow-brand-primary/20",
                "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-8 focus-visible:outline-none">
          {isLoadingOverview ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-[24px] bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : overviewData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div variants={item}>
                <MetricCard
                  label="Gross Revenue"
                  value={`$${parseFloat(overviewData.total_sales).toLocaleString()}`}
                  icon={<DollarSign className="h-5 w-5" />}
                  tone="brand"
                  helper={`${overviewData.total_orders} processed transactions`}
                />
              </motion.div>
              <motion.div variants={item}>
                <MetricCard
                  label="Gross Profit"
                  value={`$${parseFloat(overviewData.gross_profit).toLocaleString()}`}
                  icon={<Target className="h-5 w-5" />}
                  tone="emerald"
                  helper="Before operating expenses"
                />
              </motion.div>
              <motion.div variants={item}>
                <MetricCard
                  label="Operating Expense"
                  value={`$${parseFloat(overviewData.total_expenses).toLocaleString()}`}
                  icon={<TrendingDown className="h-5 w-5" />}
                  tone="rose"
                  helper={`From ${overviewData.expenses_by_date.length} liability nodes`}
                />
              </motion.div>
              <motion.div variants={item}>
                <MetricCard
                  label="Net Profit"
                  value={`$${parseFloat(overviewData.net_profit).toLocaleString()}`}
                  icon={<TrendingUp className="h-5 w-5" />}
                  tone="emerald"
                  helper="Gross profit minus operating expenses"
                />
              </motion.div>
              <motion.div variants={item}>
                <MetricCard
                  label="Performance Margin"
                  value={`${parseFloat(overviewData.profit_margin).toFixed(1)}%`}
                  icon={<Zap className="h-5 w-5" />}
                  tone="indigo"
                  helper={overviewData.profit_margin_basis === "net_revenue" ? "Based on net revenue" : "Based on reported revenue"}
                />
              </motion.div>
            </div>
          ) : null}

          <motion.div variants={item}>
            <DataPanel 
              title="Operational Trajectory" 
              description="Comparative analysis of revenue inflow vs liability outflow."
            >
              <div className="h-[400px] w-full pt-4">
                {isLoadingOverview ? (
                  <ChartSkeleton />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedChartData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#163625" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#163625" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        tickFormatter={(val) => `$${val}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#163625" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                      <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </DataPanel>
          </motion.div>
        </TabsContent>

        <TabsContent value="sales" className="focus-visible:outline-none">
          <SalesReport dateRange={formattedDateRange} />
        </TabsContent>
        <TabsContent value="expenses" className="focus-visible:outline-none">
          <ExpenseReport dateRange={formattedDateRange} />
        </TabsContent>
        <TabsContent value="inventory" className="focus-visible:outline-none">
          <InventoryReport />
        </TabsContent>
        <TabsContent value="customers" className="focus-visible:outline-none">
          <CustomerReport dateRange={formattedDateRange} />
        </TabsContent>
        <TabsContent value="profit-loss" className="focus-visible:outline-none">
          <ProfitLossReport dateRange={formattedDateRange} />
        </TabsContent>
        <TabsContent value="product-performance" className="focus-visible:outline-none">
          <ProductPerformanceReport dateRange={formattedDateRange} />
        </TabsContent>
        <TabsContent value="preorder" className="focus-visible:outline-none">
          <PreorderReport overviewData={overviewData} isLoading={isLoadingOverview} />
        </TabsContent>
        <TabsContent value="online-preorder" className="focus-visible:outline-none">
          <OnlinePreorderAnalytics dateRange={dateRange} />
        </TabsContent>
        <TabsContent value="integrity" className="focus-visible:outline-none">
          <IntegrityReport />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
