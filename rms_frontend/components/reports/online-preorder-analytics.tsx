"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Tag,
  BarChart3,
  Package,
  Activity,
  ArrowRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";
import { useOnlinePreorderAnalytics } from "@/hooks/queries/use-reports";
import { DateRange } from "react-day-picker";
import { MetricCard, DataPanel } from "@/components/ui/professional";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface OnlinePreorderAnalyticsProps {
  dateRange: DateRange;
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function OnlinePreorderAnalytics({ dateRange }: OnlinePreorderAnalyticsProps) {
  const { data: analyticsData, isLoading, error } = useOnlinePreorderAnalytics(dateRange);

  const chartData = React.useMemo(() => {
    if (!analyticsData?.sales_by_date || !Array.isArray(analyticsData.sales_by_date)) {
      return [];
    }
    
    return analyticsData.sales_by_date
      .filter((item: any) => item && item.date)
      .map((item: any) => {
        try {
          const date = new Date(item.date);
          if (isNaN(date.getTime())) return null;
          
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: parseFloat(String(item.total || '0')),
            orders: parseInt(String(item.orders_count || '0'), 10),
          };
        } catch (e) {
          return null;
        }
      })
      .filter((item: any) => item !== null);
  }, [analyticsData?.sales_by_date]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[24px]" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-[32px]" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <DataPanel title="System Conflict" description="Protocol failure while retrieving online analytics.">
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <p className="text-slate-600 font-bold">No analytics delta available.</p>
          {error && (
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest">{error.message || 'Failed to load data'}</p>
          )}
        </div>
      </DataPanel>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Inbound Traffic"
            value={analyticsData.total_orders.toString()}
            icon={<ShoppingCart className="h-5 w-5" />}
            tone="brand"
            helper="All online bookings"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Conversion Delta"
            value={analyticsData.total_sales_count.toString()}
            icon={<Activity className="h-5 w-5" />}
            tone="emerald"
            helper="Successfully completed"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Gross Inflow"
            value={formatCurrency(parseFloat(analyticsData.total_revenue))}
            icon={<DollarSign className="h-5 w-5" />}
            tone="emerald"
            helper="Aggregate online revenue"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Mean Order Yield"
            value={formatCurrency(parseFloat(analyticsData.average_order_value))}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="indigo"
            helper="Yield per conversion"
          />
        </motion.div>
      </div>

      <motion.div variants={item}>
        <DataPanel title="Revenue Velocity" description="Multi-axis analysis of online conversion delta and revenue trajectory.">
          <div className="h-[400px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
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
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#163625" fillOpacity={0.05} stroke="#163625" strokeWidth={3} name="Revenue (৳)" />
                <Bar yAxisId="right" dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} name="Order Count" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DataPanel>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div variants={item}>
          <DataPanel title="Asset Performance" description="Top performing inventory units within the online channel.">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">SKU</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Volume</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.top_products?.map((product: any, idx: number) => (
                    <TableRow key={product.product_id || idx} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-4">
                        <div>
                          <div className="text-xs font-black text-slate-700">{product.product_name}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{product.category_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 font-bold text-slate-500 text-xs">
                        {product.quantity_sold} Units
                      </TableCell>
                      <TableCell className="py-4 text-right font-black text-brand-primary text-xs">
                        {formatCurrency(parseFloat(product.total_sales))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DataPanel>
        </motion.div>

        <motion.div variants={item}>
          <DataPanel title="Departmental Inflow" description="Revenue distribution by category for online preorders.">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Department</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Volume</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.top_categories?.map((category: any, idx: number) => (
                    <TableRow key={category.category_name || idx} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-4">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest">
                          {category.category_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-right font-bold text-slate-500 text-xs">
                        {category.quantity_sold} Units
                      </TableCell>
                      <TableCell className="py-4 text-right font-black text-brand-primary text-xs">
                        {formatCurrency(parseFloat(category.total_sales))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DataPanel>
        </motion.div>
      </div>
    </div>
  );
}
