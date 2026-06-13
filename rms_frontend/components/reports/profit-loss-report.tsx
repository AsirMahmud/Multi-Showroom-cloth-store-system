"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard, DataPanel, TableSkeleton, ChartSkeleton } from "@/components/ui/professional";
import { useProfitLossReport } from "@/hooks/queries/use-reports";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon, 
  ArrowRightLeft,
  Activity,
  BarChart3,
  Percent
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function ProfitLossReport({
  dateRange,
}: {
  dateRange: { from: Date | undefined; to: Date | undefined };
}) {
  const { data: profitLossData, isLoading } = useProfitLossReport(dateRange);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[24px] bg-slate-100 animate-pulse" />
          ))}
        </div>
        <ChartSkeleton />
        <div className="grid gap-8 lg:grid-cols-2">
          <ChartSkeleton />
          <TableSkeleton cols={3} rows={5} />
        </div>
      </div>
    );
  }

  if (!profitLossData) return null;

  // Build chart data
  const revenueMap = Object.fromEntries(
    (profitLossData.revenue_by_date || []).map((item) => [
      item.date,
      parseFloat(item.revenue),
    ])
  );
  const expenseMap = Object.fromEntries(
    (profitLossData.expenses_by_date || []).map((item) => [
      item.date,
      parseFloat(item.total),
    ])
  );
  const allDates = Array.from(
    new Set([...Object.keys(revenueMap), ...Object.keys(expenseMap)])
  ).sort();
  const revenueVsExpenseData = allDates.map((date) => ({
    date,
    revenue: revenueMap[date] || 0,
    expense: expenseMap[date] || 0,
    profit: (revenueMap[date] || 0) - (expenseMap[date] || 0)
  }));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <motion.div variants={item}>
          <MetricCard
            label="Gross Revenue"
            value={formatCurrency(parseFloat(profitLossData.total_revenue))}
            icon={<DollarSign className="h-5 w-5" />}
            tone="brand"
            helper="Top-line sales before tax adjustment"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Gross Profit"
            value={formatCurrency(parseFloat(profitLossData.gross_profit))}
            icon={<Activity className="h-5 w-5" />}
            tone="emerald"
            helper="After COGS, before operating expenses"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Operating Expense"
            value={formatCurrency(parseFloat(profitLossData.total_expenses))}
            icon={<TrendingDown className="h-5 w-5" />}
            tone="rose"
            helper="Approved operating expenses"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Net Profit"
            value={formatCurrency(parseFloat(profitLossData.net_profit))}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="emerald"
            helper="Gross profit minus operating expenses"
          />
        </motion.div>
        <motion.div variants={item} className="lg:col-span-4">
          <MetricCard
            label="Profit Margin"
            value={`${parseFloat(profitLossData.profit_margin).toFixed(1)}%`}
            icon={<Percent className="h-5 w-5" />}
            tone="indigo"
            helper={profitLossData.profit_margin_basis === "net_revenue" ? "Net profit as a share of net revenue" : "Net profit as a share of total revenue"}
          />
        </motion.div>
      </div>

      <motion.div variants={item}>
        <DataPanel title="Revenue vs Expense" description="Comparison of money earned versus operational costs.">
          <div className="h-[400px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueVsExpenseData}>
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
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                <Area type="monotone" dataKey="revenue" fill="#163625" fillOpacity={0.05} stroke="#163625" strokeWidth={3} name="Total Revenue" />
                <Area type="monotone" dataKey="expense" fill="#ef4444" fillOpacity={0.05} stroke="#ef4444" strokeWidth={3} name="Total Expense" />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DataPanel>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div variants={item}>
          <DataPanel title="Profit by Category" description="Analysis of revenue and costs for each business category.">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitLossData.profit_by_category} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="category_name" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="revenue" fill="#163625" radius={[0, 4, 4, 0]} name="Revenue" />
                  <Bar dataKey="cost" fill="#94a3b8" radius={[0, 4, 4, 0]} name="Cost" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DataPanel>
        </motion.div>

        <motion.div variants={item}>
          <DataPanel title="Category Performance" description="Detailed profit analysis for each category.">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Category</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Net Profit</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitLossData.profit_by_category.map((item) => {
                    const revenue = parseFloat(item.revenue);
                    const margin = revenue > 0 ? (parseFloat(item.profit) / revenue) * 100 : 0;
                    return (
                      <TableRow key={item.category_name} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4">
                          <span className="text-xs font-bold text-slate-600">{item.category_name}</span>
                        </TableCell>
                        <TableCell className="py-4 text-right font-black text-brand-primary text-xs">
                          {formatCurrency(parseFloat(item.profit))}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <Badge variant="secondary" className={cn(
                            "border-none font-black text-[9px] uppercase tracking-widest",
                            margin > 20 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                          )}>
                            {margin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </DataPanel>
        </motion.div>
      </div>
    </div>
  );
}
