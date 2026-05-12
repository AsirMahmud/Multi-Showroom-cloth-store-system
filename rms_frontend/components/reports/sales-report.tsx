"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  Pie,
  Cell,
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
import { useSalesReport } from "@/hooks/queries/use-reports";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  CreditCard,
  Target,
  Zap,
  BarChart3,
  PieChart as PieChartIcon
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

export function SalesReport({
  dateRange,
}: {
  dateRange: { from: Date | undefined; to: Date | undefined };
}) {
  const { data: salesData, isLoading } = useSalesReport(dateRange);

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

  if (!salesData) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div variants={item}>
          <MetricCard
            label="Gross Sales"
            value={formatCurrency(parseFloat(salesData.total_sales))}
            icon={<DollarSign className="h-5 w-5" />}
            tone="brand"
            helper={`${salesData.total_orders} total orders`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Total Items Sold"
            value={salesData.total_items_sold.toString()}
            icon={<Package className="h-5 w-5" />}
            tone="emerald"
            helper="Units sold"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Average Order Value"
            value={formatCurrency(parseFloat(salesData.average_order_value))}
            icon={<Zap className="h-5 w-5" />}
            tone="indigo"
            helper="Average spend per order"
          />
        </motion.div>
      </div>

      <Tabs defaultValue="trend" className="space-y-8">
        <TabsList className="bg-slate-50 border-none p-1 h-12 shadow-inner rounded-2xl flex justify-start gap-1 w-fit">
          <TabsTrigger value="trend" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            <BarChart3 className="w-3.5 h-3.5 mr-2" /> Sales Trend
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            <PieChartIcon className="w-3.5 h-3.5 mr-2" /> Category Sales
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            <Package className="w-3.5 h-3.5 mr-2" /> Product Performance
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            <CreditCard className="w-3.5 h-3.5 mr-2" /> Payment Methods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="m-0 focus-visible:outline-none">
          <DataPanel title="Sales Performance" description="Daily revenue tracking across the selected period.">
            <div className="h-[400px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData.sales_by_date}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey={(data) => parseFloat(data.total)} stroke="#163625" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name="Gross Sales" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DataPanel>
        </TabsContent>

        <TabsContent value="categories" className="m-0 focus-visible:outline-none">
          <div className="grid gap-8 md:grid-cols-2">
            <DataPanel title="Sales by Category" description="Revenue distribution across your business categories.">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesData.sales_by_category}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey={(data) => parseFloat(data.total)}
                      nameKey="category_name"
                    >
                      {salesData.sales_by_category.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          className="stroke-white stroke-2"
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DataPanel>

            <DataPanel title="Category Details" description="Detailed performance metrics for each category.">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Category</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Revenue</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Units</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.sales_by_category.map((category) => (
                      <TableRow key={category.category_name} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4">
                          <span className="text-xs font-bold text-slate-600">{category.category_name}</span>
                        </TableCell>
                        <TableCell className="py-4 text-right font-black text-brand-primary text-xs">
                          {formatCurrency(parseFloat(category.total))}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <span className="text-xs font-bold text-slate-500">{category.quantity_sold}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DataPanel>
          </div>
        </TabsContent>

        <TabsContent value="products" className="m-0 focus-visible:outline-none">
          <DataPanel title="Best Selling Products" description="Top performing items by total revenue and profit.">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Product Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6">Category</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right">Total Revenue</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right">Units Sold</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-6 text-right">Net Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.top_products.map((product) => (
                    <TableRow key={product.product_name} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-5">
                        <span className="text-xs font-black text-slate-700">{product.product_name}</span>
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[9px] uppercase tracking-widest">
                          {product.category_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 text-right font-black text-brand-primary text-xs">
                        {formatCurrency(parseFloat(product.total_sales))}
                      </TableCell>
                      <TableCell className="py-5 text-right font-bold text-slate-500 text-xs">
                        {product.quantity_sold}
                      </TableCell>
                      <TableCell className="py-5 text-right font-black text-emerald-600 text-xs">
                        {formatCurrency(parseFloat(product.profit))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DataPanel>
        </TabsContent>

        <TabsContent value="payments" className="m-0 focus-visible:outline-none">
          <div className="grid gap-8 md:grid-cols-2">
            <DataPanel title="Payment Methods" description="How customers chose to pay for their orders.">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData.payment_methods}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="payment_method" 
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
                    <Bar
                      dataKey={(data) => parseFloat(data.total)}
                      fill="#163625"
                      radius={[8, 8, 0, 0]}
                      name="Total Settled"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DataPanel>

            <DataPanel title="Payment Channel Details" description="Detailed performance for each payment method.">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Method</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Total Settled</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.payment_methods.map((method) => (
                      <TableRow key={method.payment_method} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4">
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none font-black text-[9px] uppercase tracking-widest">
                            {method.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-right font-black text-brand-primary text-xs">
                          {formatCurrency(parseFloat(method.total))}
                        </TableCell>
                        <TableCell className="py-4 text-right font-bold text-slate-500 text-xs">
                          {method.orders_count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DataPanel>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
