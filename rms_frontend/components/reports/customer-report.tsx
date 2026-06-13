"use client";

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
  Area,
  AreaChart
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
import { useCustomerReport } from "@/hooks/queries/use-reports";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  DollarSign, 
  Crown, 
  Calendar,
  Activity,
  ShoppingBag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function CustomerReport({
  dateRange,
}: {
  dateRange: { from: Date | undefined; to: Date | undefined };
}) {
  const { data: customerData, isLoading } = useCustomerReport(dateRange);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-[24px] bg-slate-100 animate-pulse" />
          ))}
        </div>
        <ChartSkeleton />
        <TableSkeleton cols={5} rows={5} />
      </div>
    );
  }

  if (!customerData) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div variants={item}>
          <MetricCard
            label="Total Customers"
            value={customerData.total_customers.toString()}
            icon={<Users className="h-5 w-5" />}
            tone="brand"
            helper={`${customerData.new_customers} new registrations`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Total Sales"
            value={formatCurrency(parseFloat(customerData.total_sales))}
            icon={<DollarSign className="h-5 w-5" />}
            tone="emerald"
            helper="Revenue from all customers"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Avg Customer Value"
            value={formatCurrency(parseFloat(customerData.average_customer_value))}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="indigo"
            helper="Average spend per customer"
          />
        </motion.div>
      </div>

      <motion.div variants={item}>
        <DataPanel title="Customer Acquisition" description="Tracking new customer registrations over time.">
          <div className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={customerData.customer_acquisition}>
                <defs>
                  <linearGradient id="colorAcquisition" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#163625" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#163625" stopOpacity={0}/>
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
                <Area 
                  type="monotone" 
                  dataKey="new_customers" 
                  stroke="#163625" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorAcquisition)" 
                  name="New Customers" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataPanel>
      </motion.div>

      <motion.div variants={item}>
        <DataPanel title="Top Customers" description="Your most loyal customers based on total spend and order frequency.">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Customer Name</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Products Bought</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Units Bought</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right">Total Spend</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right">Last Purchase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerData.top_customers.map((customer, index) => (
                  <TableRow key={`${customer.first_name}-${customer.last_name}`} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-brand-secondary text-brand-primary text-[10px] font-black">
                            {customer.first_name[0]}{customer.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-xs font-black text-slate-700">{`${customer.first_name} ${customer.last_name}`}</div>
                          <div className="text-[9px] font-bold text-slate-400">{customer.phone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-black text-[9px] uppercase tracking-widest">
                        {customer.unique_products} Items
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="h-3 w-3 text-slate-300" />
                        <span className="text-xs font-bold text-slate-500">{customer.items_purchased} Units</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-right font-black text-brand-primary text-xs">
                      {formatCurrency(parseFloat(customer.total_sales))}
                    </TableCell>
                    <TableCell className="py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Calendar className="h-3 w-3 text-slate-300" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{customer.last_purchase_date}</span>
                      </div>
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
