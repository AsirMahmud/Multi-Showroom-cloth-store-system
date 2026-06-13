"use client";

import { useState } from "react";
import { PageHeader, MetricCard, DataPanel } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Calendar 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useDashboardStats } from "@/hooks/queries/use-expenses";
import { ExpenseForm } from "@/components/expense/expense-form";
import { ExpenseList } from "@/components/expense/expense-list";
import { CategoryManager } from "@/components/expense/category-manager";
import { ReportsPage } from "@/components/expense/reports-page";
import { Button } from "@/components/ui/button";

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

export default function ExpenseManagement() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: stats, isLoading } = useDashboardStats();

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

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="Expense Control"
        description="Monitor operational costs, manage categories, and generate financial reports."
        icon={<DollarSign className="h-6 w-6" />}
        actions={
          <Button
            onClick={() => setActiveTab("add-expense")}
            className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
          >
            <TrendingUp className="h-3.5 w-3.5 mr-2" />
            Log Expense
          </Button>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <TabsList className="flex w-full bg-white/50 backdrop-blur-xl border border-brand-primary/5 shadow-premium rounded-2xl p-1 overflow-x-auto h-auto no-scrollbar">
          {[
            { id: "dashboard", label: "Overview" },
            { id: "expenses", label: "Ledger" },
            { id: "categories", label: "Taxonomy" },
            { id: "reports", label: "Analytics" },
            { id: "add-expense", label: "New Entry" }
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex-1 min-w-[100px] py-2.5 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest",
                "data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary data-[state=active]:shadow-lg data-[state=active]:shadow-brand-primary/20",
                "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={item}>
              <MetricCard
                label="Monthly Total"
                value={formatCurrency(stats?.monthly.total_amount || 0)}
                icon={<DollarSign className="h-5 w-5" />}
                tone="brand"
                helper="Total for current month"
              />
            </motion.div>
            <motion.div variants={item}>
              <MetricCard
                label="Today's Burn"
                value={formatCurrency(stats?.today.total_amount || 0)}
                icon={<Calendar className="h-5 w-5" />}
                tone="emerald"
                helper={`${stats?.today.total_count || 0} entries today`}
              />
            </motion.div>
            <motion.div variants={item}>
              <MetricCard
                label="Pending Review"
                value={stats?.today.pending_count || 0}
                icon={<ShoppingCart className="h-5 w-5" />}
                tone="rose"
                helper="Awaiting approval"
              />
            </motion.div>
            <motion.div variants={item}>
              <MetricCard
                label="Settled Today"
                value={stats?.today.approved_count || 0}
                icon={<TrendingUp className="h-5 w-5" />}
                tone="indigo"
                helper="Approved expenses"
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div variants={item}>
              <DataPanel title="Financial Trend" description="Comparison of operational costs over the last 6 cycles.">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" stroke="#cbd5e1" fontSize={10} fontWeight={700} />
                      <YAxis stroke="#cbd5e1" fontSize={10} fontWeight={700} />
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "none",
                          borderRadius: "16px",
                          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#163625"
                        strokeWidth={3}
                        dot={{ fill: "#163625", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: "#163625", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </DataPanel>
            </motion.div>

            <motion.div variants={item}>
              <DataPanel title="Category Breakdown" description="Distribution of costs by department this month.">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.category_distribution}
                        dataKey="total"
                        nameKey="category__name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={5}
                      >
                        {stats?.category_distribution.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.category__color || ["#163625", "#34d399", "#fbbf24", "#f87171", "#818cf8"][index % 5]}
                            className="stroke-white stroke-2"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                        contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </DataPanel>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="focus-visible:outline-none">
          <motion.div variants={item}>
            <ExpenseList />
          </motion.div>
        </TabsContent>

        <TabsContent value="categories" className="focus-visible:outline-none">
          <motion.div variants={item}>
            <CategoryManager />
          </motion.div>
        </TabsContent>

        <TabsContent value="reports" className="focus-visible:outline-none">
          <motion.div variants={item}>
            <ReportsPage />
          </motion.div>
        </TabsContent>

        <TabsContent value="add-expense" className="focus-visible:outline-none">
          <motion.div variants={item}>
            <ExpenseForm />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
