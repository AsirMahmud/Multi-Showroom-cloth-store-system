"use client";

import { useState } from "react";
import { PageHeader, MetricCard, DataPanel } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { 
  Plus, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
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
import { usePreorderStats } from "@/hooks/queries/use-preorder";
import { PreorderList } from "@/components/preorder/preorder-list";
import { PreorderStats } from "@/types/preorder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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

export default function PreorderPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: stats, isLoading } = usePreorderStats();

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

  const typedStats = stats as PreorderStats | undefined;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-800";
      case "CONFIRMED": return "bg-blue-100 text-blue-800";
      case "DEPOSIT_PAID": return "bg-orange-100 text-orange-800";
      case "FULLY_PAID": return "bg-emerald-100 text-emerald-800";
      case "ARRIVED": return "bg-purple-100 text-purple-800";
      case "DELIVERED": return "bg-indigo-100 text-indigo-800";
      case "COMPLETED": return "bg-emerald-100 text-emerald-800";
      case "CANCELLED": return "bg-rose-100 text-rose-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const statusChartData = typedStats?.status_breakdown
    ? Object.entries(typedStats.status_breakdown).map(([status, count]) => ({
        status,
        count,
      }))
    : [];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="Preorder Management"
        description="Advance order tracking, deposit monitoring, and delivery fulfillment engine."
        icon={<Package className="h-6 w-6" />}
        actions={
          <Button
            asChild
            className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
          >
            <Link href="/preorder/create">
              <Plus className="mr-2 h-3.5 w-3.5" />
              Create Preorder
            </Link>
          </Button>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <TabsList className="flex w-full bg-white/50 backdrop-blur-xl border border-brand-primary/5 shadow-premium rounded-2xl p-1 h-auto overflow-x-auto no-scrollbar">
          {[
            { id: "dashboard", label: "Overview" },
            { id: "orders", label: "Ledger" }
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex-1 min-w-[120px] py-2.5 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest",
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
                label="Total Volume"
                value={typedStats?.total_orders || 0}
                icon={<ShoppingCart className="h-5 w-5" />}
                tone="brand"
                helper="All-time preorders"
              />
            </motion.div>
            <motion.div variants={item}>
              <MetricCard
                label="Projected Revenue"
                value={formatCurrency(typedStats?.total_revenue || 0)}
                icon={<TrendingUp className="h-5 w-5" />}
                tone="emerald"
                helper="Total expected value"
              />
            </motion.div>
            <motion.div variants={item}>
              <MetricCard
                label="Pending Fulfillment"
                value={typedStats?.pending_orders || 0}
                icon={<Calendar className="h-5 w-5" />}
                tone="rose"
                helper="Awaiting completion"
              />
            </motion.div>
            <motion.div variants={item}>
              <MetricCard
                label="Delivered Units"
                value={typedStats?.completed_orders || 0}
                icon={<Package className="h-5 w-5" />}
                tone="indigo"
                helper="Successfully fulfilled"
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div variants={item}>
              <DataPanel title="Status Dynamics" description="Real-time distribution of orders across fulfillment stages.">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={5}
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={["#163625", "#34d399", "#fbbf24", "#f87171", "#818cf8", "#f472b6"][index % 6]}
                            className="stroke-white stroke-2"
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </DataPanel>
            </motion.div>

            <motion.div variants={item}>
              <DataPanel title="Product Interest" description="Top products currently requested via preorders.">
                <div className="h-[300px] flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest italic">
                  Advanced Product Analytics Coming Soon
                </div>
              </DataPanel>
            </motion.div>

            {typedStats?.status_breakdown && (
              <motion.div variants={item} className="lg:col-span-2">
                <DataPanel title="Detailed Logistics" description="Granular breakdown of all order lifecycle stages.">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(typedStats.status_breakdown).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-brand-primary/5 transition-all hover:bg-white hover:shadow-sm">
                        <Badge className={cn("rounded-lg font-bold text-[9px] uppercase tracking-widest border-none", getStatusColor(status))}>
                          {status}
                        </Badge>
                        <span className="text-lg font-black text-brand-primary">{count}</span>
                      </div>
                    ))}
                  </div>
                </DataPanel>
              </motion.div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="focus-visible:outline-none">
          <motion.div variants={item}>
            <PreorderList />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
