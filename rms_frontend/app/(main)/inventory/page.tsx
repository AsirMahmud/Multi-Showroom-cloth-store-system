"use client";

import React from "react";
import { PageHeader, MetricCard, DataPanel, ChartSkeleton } from "@/components/ui/professional";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { 
  Package, 
  PlusCircle, 
  Settings, 
  DollarSign, 
  AlertTriangle, 
  TrendingDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useDashboardOverview } from "@/hooks/queries/useInventory";
import { useToast } from "@/hooks/use-toast";
import { DashboardCharts } from "@/components/inventory/dashboard-charts";
import { StockAlerts } from "@/components/inventory/stock-alerts";

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

export default function InventoryPage() {
  const { data: overview, isLoading } = useDashboardOverview("month");
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isLoading && overview) {
      const stockHealth =
        (overview?.metrics?.total_products || 0) > 0
          ? (((overview?.metrics?.total_products || 0) -
              (overview?.metrics?.out_of_stock_products || 0)) /
              (overview?.metrics?.total_products || 1)) *
            100
          : 0;

      if (stockHealth <= 60) {
        toast({
          variant: "destructive",
          title: "Critical Stock Health",
          description: `Your inventory health is at ${stockHealth.toFixed(1)}%. Immediate action required.`,
        });
      }
      if (overview?.metrics?.low_stock_products > 0) {
        toast({
          title: "Low Stock Alert",
          description: `${overview.metrics.low_stock_products} items are running low.`,
        });
      }
      if (overview?.metrics?.out_of_stock_products > 0) {
        toast({
          variant: "destructive",
          title: "Out of Stock",
          description: `${overview.metrics.out_of_stock_products} items are unavailable.`,
        });
      }
    }
  }, [isLoading, overview, toast]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-100 animate-pulse rounded-xl" />
            <div className="h-4 w-96 bg-slate-50 animate-pulse rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[24px] bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  const stockHealth =
    (overview?.metrics?.total_products || 0) > 0
      ? (((overview?.metrics?.total_products || 0) -
          (overview?.metrics?.out_of_stock_products || 0)) /
          (overview?.metrics?.total_products || 1)) *
        100
      : 0;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="Inventory Engine"
        description="Global stock management, procurement tracking, and inventory health analytics."
        icon={<Package className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button
              asChild
              className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
            >
              <Link href="/inventory/products/new">
                <PlusCircle className="h-3.5 w-3.5 mr-2" />
                Add Product
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-10 px-4 bg-white border-brand-primary/5 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary hover:bg-slate-50"
            >
              <Settings className="h-3.5 w-3.5 mr-2" />
              Config
            </Button>
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Total Products"
            value={overview?.metrics.total_products || 0}
            icon={<Package className="h-5 w-5" />}
            tone="brand"
            helper={`${overview?.metrics.active_products} Live SKUs`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Inventory Value"
            value={formatCurrency(overview?.metrics.total_inventory_value || 0)}
            icon={<DollarSign className="h-5 w-5" />}
            tone="brand"
            helper="Current asset value"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Low Stock"
            value={overview?.metrics.low_stock_products || 0}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="indigo"
            helper="Restock required soon"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Out of Stock"
            value={overview?.metrics.out_of_stock_products || 0}
            icon={<TrendingDown className="h-5 w-5" />}
            tone="rose"
            helper="Critical unavailability"
          />
        </motion.div>
      </div>

      <motion.div variants={item}>
        <DashboardCharts />
      </motion.div>

      <motion.div variants={item}>
        <StockAlerts />
      </motion.div>
    </motion.div>
  );
}
