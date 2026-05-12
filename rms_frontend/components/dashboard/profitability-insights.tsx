"use client";

import { motion } from "framer-motion";
import { DataPanel, MetricCard } from "@/components/ui/professional";
import { 
  TrendingUp, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight,
  Target,
  BarChart3
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface ProfitabilityInsightsProps {
  data: {
    marginTrend: any[];
    profitByCategory: any[];
    overallMargin: number;
    marginChange: number;
  };
}

export function ProfitabilityInsights({ data }: ProfitabilityInsightsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <motion.div variants={item}>
        <DataPanel 
          title="Profit Margin Trends" 
          description="Analysis of net profit margin fluctuations over time."
          actions={<Percent className="h-4 w-4 text-emerald-500" />}
        >
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.marginTrend}>
                <defs>
                  <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="margin" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#marginGradient)" 
                  name="Margin %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataPanel>
      </motion.div>

      <motion.div variants={item}>
        <DataPanel 
          title="Profit by Category" 
          description="Top 5 categories contributing to total net profit."
          actions={<BarChart3 className="h-4 w-4 text-brand-primary" />}
        >
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.profitByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="profit" radius={[0, 6, 6, 0]} barSize={20}>
                  {data.profitByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#163625', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataPanel>
      </motion.div>
    </div>
  );
}
