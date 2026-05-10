"use client";

import { useState } from "react";
import { DataPanel, MetricCard } from "@/components/ui/professional";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, TrendingUp, DollarSign, Package, Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProductHistoryProps {
  productId?: string;
  showHeader?: boolean;
}

export function ProductHistory({
  productId,
  showHeader = true,
}: ProductHistoryProps) {
  const [timeRange, setTimeRange] = useState("30days");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  // Mock data - in a real app, this would be fetched based on productId and date range
  const salesHistory = [
    {
      date: "2023-05-01",
      quantity: 5,
      revenue: 249.95,
      customer: "John Doe",
      discount: "0%",
      staff: "Emma Wilson",
    },
    {
      date: "2023-05-02",
      quantity: 2,
      revenue: 99.98,
      customer: "Sarah Johnson",
      discount: "10%",
      staff: "Michael Brown",
    },
    {
      date: "2023-05-03",
      quantity: 1,
      revenue: 49.99,
      customer: "Robert Smith",
      discount: "0%",
      staff: "Emma Wilson",
    },
    {
      date: "2023-05-04",
      quantity: 3,
      revenue: 149.97,
      customer: "Lisa Anderson",
      discount: "5%",
      staff: "James Taylor",
    },
    {
      date: "2023-05-05",
      quantity: 4,
      revenue: 199.96,
      customer: "David Wilson",
      discount: "0%",
      staff: "Michael Brown",
    },
  ];

  const totalQuantity = salesHistory.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = salesHistory.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Cumulative Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="h-4 w-4" />}
          trend={{ value: 12.5, isPositive: true }}
        />
        <MetricCard
          title="Units Dispatched"
          value={totalQuantity.toString()}
          icon={<Package className="h-4 w-4" />}
          trend={{ value: 8.2, isPositive: true }}
        />
        <MetricCard
          title="Velocity (Avg/Day)"
          value={(totalQuantity / 30).toFixed(2)}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ value: 4.1, isPositive: false }}
        />
      </div>

      <DataPanel 
        title="Transaction Stream" 
        description="Granular log of every interaction and conversion involving this inventory unit."
        actions={
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-9 w-[160px] bg-white border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100">
                <SelectItem value="7days" className="text-[10px] font-black uppercase">7 Day Cycle</SelectItem>
                <SelectItem value="30days" className="text-[10px] font-black uppercase">30 Day Cycle</SelectItem>
                <SelectItem value="90days" className="text-[10px] font-black uppercase">Quarterly</SelectItem>
                <SelectItem value="custom" className="text-[10px] font-black uppercase">Custom Bound</SelectItem>
              </SelectContent>
            </Select>

            {timeRange === "custom" && (
              <DatePickerWithRange
                value={dateRange}
                onChange={setDateRange}
              />
            )}

            <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-100 bg-white shadow-sm font-black text-[10px] uppercase tracking-widest px-4">
              <Download className="mr-2 h-3 w-3" />
              Export
            </Button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Timestamp</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Volume</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Revenue Yield</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Client</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Margin Adjusted</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Agent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesHistory.map((sale, index) => (
                <TableRow key={index} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3 text-slate-300" />
                      <span className="text-xs font-bold text-slate-600">{sale.date}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 font-black text-xs text-brand-primary">
                    {sale.quantity} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Units</span>
                  </TableCell>
                  <TableCell className="py-5 font-black text-xs text-brand-primary">
                    {formatCurrency(sale.revenue)}
                  </TableCell>
                  <TableCell className="py-5">
                    <span className="text-xs font-bold text-slate-600">{sale.customer}</span>
                  </TableCell>
                  <TableCell className="py-5">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      sale.discount === "0%" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                    )}>
                      {sale.discount === "0%" ? "Full Price" : `${sale.discount} Disc`}
                    </span>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {sale.staff.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs font-bold text-slate-500">{sale.staff}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DataPanel>
    </div>
  );
}
