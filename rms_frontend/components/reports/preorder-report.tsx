"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard, DataPanel } from "@/components/ui/professional";
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Tag, 
  ArrowRight,
  ClipboardList,
  Clock,
  CheckCircle2,
  Package,
  Activity
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface PreorderReportProps {
  overviewData: any;
  isLoading: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  DEPOSIT_PAID: "Deposit Paid",
  FULLY_PAID: "Fully Paid",
  ARRIVED: "Arrived",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function PreorderReport({
  overviewData,
  isLoading,
}: PreorderReportProps) {
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[24px]" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-[32px]" />
      </div>
    );
  }

  if (!overviewData) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Booking Volume"
            value={overviewData.preorder_total_orders || 0}
            icon={<ShoppingCart className="h-5 w-5" />}
            tone="brand"
            helper="Total preorders in system"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Committed Revenue"
            value={formatCurrency(parseFloat(overviewData.preorder_total_revenue || 0))}
            icon={<DollarSign className="h-5 w-5" />}
            tone="emerald"
            helper="Gross value of all bookings"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Projected Yield"
            value={formatCurrency(parseFloat(overviewData.preorder_profit || 0))}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="indigo"
            helper="Estimated net margin"
          />
        </motion.div>
      </div>

      <motion.div variants={item}>
        <DataPanel title="Workflow Lifecycle" description="Segmentation of preorders by current operational status.">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {overviewData.preorder_status_breakdown &&
              Object.entries(overviewData.preorder_status_breakdown).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="p-4 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl flex items-center justify-between hover:border-brand-primary/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-colors">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {STATUS_LABELS[status] || status}
                        </div>
                        <div className="text-lg font-black text-slate-700">
                          {String(count)}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-brand-primary transition-colors" />
                  </div>
                )
              )}
            {!overviewData.preorder_status_breakdown && (
              <div className="col-span-full text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
                No active lifecycle data available.
              </div>
            )}
          </div>
        </DataPanel>
      </motion.div>
    </div>
  );
}
