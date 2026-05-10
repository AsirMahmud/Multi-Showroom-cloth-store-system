"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { MetricCard, DataPanel, TableSkeleton, ChartSkeleton } from "@/components/ui/professional";
import { useInventoryReport } from "@/hooks/queries/use-reports";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  BarChart3, 
  Layers, 
  ArrowRightLeft,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  "#163625", // Brand Primary
  "#34d399", // Emerald
  "#818cf8", // Indigo
  "#fbbf24", // Amber
  "#f472b6", // Pink
  "#2dd4bf", // Teal
];

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function InventoryReport() {
  const { data: inventoryData, isLoading } = useInventoryReport();

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
          <ChartSkeleton />
        </div>
        <TableSkeleton cols={4} rows={5} />
      </div>
    );
  }

  if (!inventoryData) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div variants={item}>
          <MetricCard
            label="Total Catalog"
            value={inventoryData.total_products.toString()}
            icon={<Package className="h-5 w-5" />}
            tone="brand"
            helper={`${inventoryData.stock_by_category.length} Active Categories`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Valuation"
            value={formatCurrency(parseFloat(inventoryData.total_stock_value))}
            icon={<DollarSign className="h-5 w-5" />}
            tone="emerald"
            helper="Current asset value"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Low Stock Alerts"
            value={inventoryData.low_stock_items.length.toString()}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="rose"
            helper="Items below reorder level"
          />
        </motion.div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div variants={item}>
          <DataPanel title="Stock Distribution" description="Comparative volume per inventory department.">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData.stock_by_category}>
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
                  />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="total_stock" fill="#163625" radius={[8, 8, 0, 0]} name="Total Units" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DataPanel>
        </motion.div>

        <motion.div variants={item}>
          <DataPanel title="Category Valuation" description="Financial exposure per inventory department.">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData.stock_by_category}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey={(data) => parseFloat(data.total_value)}
                    nameKey="category_name"
                  >
                    {inventoryData.stock_by_category.map((entry, index) => (
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
      </div>

      <motion.div variants={item}>
        <DataPanel title="Critical Stock Watch" description="Inventory units requiring immediate replenishment to prevent stockouts.">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">SKU Identifier</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Stock Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Reorder Threshold</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right">Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.low_stock_items.map((item) => (
                  <TableRow key={item.name} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-5">
                      <span className="text-xs font-black text-slate-700">{item.name}</span>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-rose-50 text-rose-600 border-none font-bold text-[10px] px-2 py-0.5">
                          {item.stock} Units
                        </Badge>
                        <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-rose-500" 
                            style={{ width: `${Math.min(100, (item.stock / item.reorder_level) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {item.reorder_level} Units
                      </span>
                    </TableCell>
                    <TableCell className="py-5 text-right font-black text-brand-primary text-xs">
                      {formatCurrency(parseFloat(item.price))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DataPanel>
      </motion.div>

      <motion.div variants={item}>
        <DataPanel title="Logistics Activity" description="Historical log of inventory movements and volume changes.">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Timestamp</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Protocol</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Volume Delta</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Value Delta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.stock_movements.map((movement) => (
                  <TableRow key={`${movement.date}-${movement.movement_type}`} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4 text-xs font-bold text-slate-600">{movement.date}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant="secondary" className={cn(
                        "border-none font-black text-[9px] uppercase tracking-widest",
                        movement.movement_type === 'sale' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                      )}>
                        {movement.movement_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-right font-bold text-slate-600 text-xs">
                      {movement.total_quantity} Units
                    </TableCell>
                    <TableCell className="py-4 text-right font-black text-brand-primary text-xs">
                      {formatCurrency(parseFloat(movement.total_value))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DataPanel>
      </motion.div>
    </div>
  );
}

function Legend({ iconType }: { iconType: string }) {
  return null; // Implementation of Legend if needed, or use recharts Legend
}
