"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar
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
import { useExpenseReport } from "@/hooks/queries/use-reports";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon, 
  Calendar,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  "#ef4444", // Rose/Red (for expenses)
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
];

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function ExpenseReport({
  dateRange,
}: {
  dateRange: { from: Date | undefined; to: Date | undefined };
}) {
  const { data: expenseData, isLoading } = useExpenseReport(dateRange);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-[24px] bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <ChartSkeleton />
          <TableSkeleton cols={3} rows={5} />
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  if (!expenseData) return null;

  const largestExpense = expenseData.expenses_by_category.reduce(
    (max, cat) => (parseFloat(cat.total) > parseFloat(max.total) ? cat : max),
    { category_name: "N/A", total: "0" }
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div variants={item}>
          <MetricCard
            label="Total Outflow"
            value={formatCurrency(parseFloat(expenseData.total_expenses))}
            icon={<TrendingDown className="h-5 w-5" />}
            tone="rose"
            helper={`Over ${expenseData.expenses_by_date.length} active days`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Primary Drain"
            value={formatCurrency(parseFloat(largestExpense.total))}
            icon={<AlertCircle className="h-5 w-5" />}
            tone="brand"
            helper={`${largestExpense.category_name} department`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Liability Nodes"
            value={expenseData.expenses_by_category.length.toString()}
            icon={<PieChartIcon className="h-5 w-5" />}
            tone="indigo"
            helper="Active expense categories"
          />
        </motion.div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div variants={item}>
          <DataPanel title="Capital Distribution" description="Comparative analysis of liabilities across departments.">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData.expenses_by_category}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey={(data) => parseFloat(data.total)}
                    nameKey="category_name"
                  >
                    {expenseData.expenses_by_category.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        className="stroke-white stroke-2"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: string) => formatCurrency(parseFloat(value))}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </DataPanel>
        </motion.div>

        <motion.div variants={item}>
          <DataPanel title="Temporal Outflow" description="Daily log of operational liability settlements.">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Timestamp</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-center">Nodes</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Settled Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseData.expenses_by_date.map((expense, index) => (
                    <TableRow key={index} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-slate-300" />
                          <span className="text-xs font-bold text-slate-600">{expense.date}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[10px]">
                          {expense.count}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-right font-black text-rose-600 text-xs">
                        {formatCurrency(parseFloat(expense.total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DataPanel>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <DataPanel title="Departmental Audit" description="Detailed breakdown of expenses per cost center.">
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData.expenses_by_category}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="category_name" 
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
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Bar
                  dataKey={(data) => parseFloat(data.total)}
                  fill="#ef4444"
                  radius={[8, 8, 0, 0]}
                  name="Category Total"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataPanel>
      </motion.div>
    </div>
  );
}
