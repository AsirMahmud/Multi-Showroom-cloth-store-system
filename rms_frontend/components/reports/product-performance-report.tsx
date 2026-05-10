"use client";

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  BarChart3,
  Target,
  Award,
  Star,
  AlertTriangle,
  Activity,
  Zap,
  Users,
  Calendar,
  Clock,
  ExternalLink,
  Percent
} from "lucide-react";
import { useProductPerformanceReport } from "@/hooks/queries/use-reports";
import { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MetricCard, DataPanel, TableSkeleton, ChartSkeleton } from "@/components/ui/professional";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProductPerformanceReportProps {
  dateRange: DateRange | undefined;
}

const COLORS = ['#163625', '#34d399', '#818cf8', '#fbbf24', '#f472b6', '#2dd4bf'];

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function ProductPerformanceReport({ dateRange }: ProductPerformanceReportProps) {
  const [viewType, setViewType] = useState<string>("overview");
  const router = useRouter();

  const { data: productData, isLoading, error } = useProductPerformanceReport(dateRange);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[24px] bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <TableSkeleton cols={5} rows={10} />
      </div>
    );
  }

  if (error || !productData) {
    return (
      <DataPanel title="System Conflict" description="Protocol failure while retrieving performance metrics.">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <p className="text-slate-600 font-bold">Failed to load performance delta.</p>
          <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </div>
      </DataPanel>
    );
  }

  const averageProfitMargin = parseFloat(productData.average_profit_margin);
  const averageProfit = parseFloat(productData.average_profit);
  const averageSellingPriceWithDiscount = parseFloat(productData.average_selling_price_with_discount);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Inventory Nodes"
            value={productData.total_products.toString()}
            icon={<Package className="h-5 w-5" />}
            tone="brand"
            helper={`${productData.top_performing_products.length} High-Velocity SKUs`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Yield Efficiency"
            value={`${averageProfitMargin.toFixed(1)}%`}
            icon={<Percent className="h-5 w-5" />}
            tone={averageProfitMargin > 20 ? "emerald" : "indigo"}
            helper="Aggregate profit margin"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Unit Velocity"
            value={formatCurrency(averageProfit)}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="emerald"
            helper="Net profit per unit sold"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Settlement Mean"
            value={formatCurrency(averageSellingPriceWithDiscount)}
            icon={<DollarSign className="h-5 w-5" />}
            tone="indigo"
            helper="Avg price after discounts"
          />
        </motion.div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8" value={viewType} onValueChange={setViewType}>
        <TabsList className="bg-slate-50 border-none p-1 h-12 shadow-inner rounded-2xl flex justify-start gap-1 w-fit">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="top" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            Top Yield
          </TabsTrigger>
          <TabsTrigger value="low" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            Critical Watch
          </TabsTrigger>
          <TabsTrigger value="details" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            Full Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="m-0 space-y-8 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div variants={item}>
              <DataPanel title="Performance Delta" description="Segmentation of inventory assets by operational health.">
                <div className="h-[300px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Top Performers', value: productData.top_performing_products.length, color: '#10b981' },
                      { name: 'Critical Stock', value: productData.low_performing_products.length, color: '#ef4444' },
                      { name: 'Active SKUs', value: productData.sales_by_product.length, color: '#6366f1' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {[...Array(3)].map((_, index) => (
                          <Cell key={index} fill={['#10b981', '#ef4444', '#6366f1'][index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DataPanel>
            </motion.div>

            <motion.div variants={item}>
              <DataPanel title="Fiscal Resilience" description="Profit margin stability across the active catalog.">
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mean Efficiency</span>
                      <span className="text-xs font-black text-brand-primary">{averageProfitMargin.toFixed(1)}%</span>
                    </div>
                    <Progress value={averageProfitMargin} className="h-2 bg-slate-100" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="text-xl font-black text-emerald-700">
                        {productData.profit_by_product.filter(p => parseFloat(p.profit_margin) > 20).length}
                      </div>
                      <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">High Velocity Nodes</div>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                      <div className="text-xl font-black text-rose-700">
                        {productData.profit_by_product.filter(p => parseFloat(p.profit_margin) <= 10).length}
                      </div>
                      <div className="text-[9px] font-black text-rose-600 uppercase tracking-widest mt-1">Stagnant Capital</div>
                    </div>
                  </div>
                </div>
              </DataPanel>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="top" className="m-0 focus-visible:outline-none">
          <DataPanel title="Elite Inventory" description="Top performing assets by revenue yield and profit conversion.">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">SKU Identifier</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Volume</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right">Revenue</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right">Net Profit</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productData.top_performing_products.map((product, index) => (
                    <TableRow key={product.product_name} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/inventory/products/${product.product_id}`)}>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center font-black text-[10px] rounded-lg border-slate-200">
                            {index + 1}
                          </Badge>
                          <div>
                            <div className="text-xs font-black text-slate-700">{product.product_name}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{product.category_name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <span className="text-xs font-bold text-slate-500">{product.quantity_sold} Units</span>
                      </TableCell>
                      <TableCell className="py-5 text-right font-black text-slate-900 text-xs">
                        {formatCurrency(parseFloat(product.total_sales))}
                      </TableCell>
                      <TableCell className="py-5 text-right font-black text-brand-primary text-xs">
                        {formatCurrency(parseFloat(product.total_profit))}
                      </TableCell>
                      <TableCell className="py-5 text-right">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest">
                          {parseFloat(product.profit_margin).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DataPanel>
        </TabsContent>

        <TabsContent value="low" className="m-0 focus-visible:outline-none">
          <DataPanel title="Risk Exposure" description="Inventory units with stagnant movement or negative profit delta.">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">SKU Identifier</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Volume</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right">Net Profit</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right">Yield Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productData.low_performing_products.map((product) => (
                    <TableRow key={product.product_name} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-5">
                        <span className="text-xs font-black text-slate-700">{product.product_name}</span>
                      </TableCell>
                      <TableCell className="py-5 font-bold text-slate-500 text-xs">
                        {product.quantity_sold} Units
                      </TableCell>
                      <TableCell className={cn(
                        "py-5 text-right font-black text-xs",
                        parseFloat(product.total_profit) < 0 ? "text-rose-600" : "text-amber-600"
                      )}>
                        {formatCurrency(parseFloat(product.total_profit))}
                      </TableCell>
                      <TableCell className="py-5 text-right">
                        <Badge className={cn(
                          "border-none font-black text-[9px] uppercase tracking-widest",
                          parseFloat(product.total_profit) < 0 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {parseFloat(product.total_profit) < 0 ? "Loss" : "Stagnant"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DataPanel>
        </TabsContent>

        <TabsContent value="details" className="m-0 focus-visible:outline-none">
          <DataPanel title="Full Performance Matrix" description="Exhaustive log of every active SKU in the organizational catalog.">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Product</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Revenue</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Profit</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productData.sales_by_product.map((product) => {
                    const profitData = productData.profit_by_product.find(p => p.product_name === product.product_name);
                    return (
                      <TableRow key={product.product_name} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4 text-xs font-bold text-slate-600">{product.product_name}</TableCell>
                        <TableCell className="py-4 text-right font-black text-slate-900 text-xs">
                          {formatCurrency(parseFloat(product.total_sales))}
                        </TableCell>
                        <TableCell className="py-4 text-right font-black text-brand-primary text-xs">
                          {profitData ? formatCurrency(parseFloat(profitData.total_profit)) : '$0.00'}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <span className="text-xs font-black text-slate-400">
                            {profitData ? `${parseFloat(profitData.profit_margin).toFixed(1)}%` : '0%'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </DataPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
