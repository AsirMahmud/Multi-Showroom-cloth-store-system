import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
} from "recharts";
import {
  useDashboardOverview,
  useStockMovementAnalysis,
} from "@/hooks/queries/useInventory";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataPanel, ChartSkeleton } from "@/components/ui/professional";
import { cn } from "@/lib/utils";
import { StockMovementAnalysis } from "@/types/inventory";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function DashboardCharts() {
  const { data: overview, isLoading: isOverviewLoading } =
    useDashboardOverview("month");
  const { data: movementAnalysis, isLoading: isMovementLoading } =
    useStockMovementAnalysis("month");

  if (isOverviewLoading || isMovementLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  const categoryData =
    overview?.category_distribution.map((category) => ({
      name: category.name,
      value: category.total_value || 0,
    })) || [];

  const movementData =
    movementAnalysis?.daily_movements.map((trend) => ({
      date: new Date(trend.date).toLocaleDateString(),
      stockIn: trend.stock_in || 0,
      stockOut: trend.stock_out || 0,
    })) || [];

  const categoryMovementData =
    movementAnalysis?.category_movements.map((category) => ({
      name: category.product__category__name,
      stockIn: category.stock_in || 0,
      stockOut: category.stock_out || 0,
    })) || [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="movement" className="w-full">
        <TabsList className="flex w-full bg-white/50 backdrop-blur-xl border border-brand-primary/5 shadow-premium rounded-2xl p-1 h-auto overflow-x-auto no-scrollbar mb-8">
          <TabsTrigger
            value="movement"
            className="flex-1 py-2.5 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary data-[state=active]:shadow-lg data-[state=active]:shadow-brand-primary/20 text-slate-400 hover:text-slate-600"
          >
            Movement Trends
          </TabsTrigger>
          <TabsTrigger
            value="distribution"
            className="flex-1 py-2.5 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary data-[state=active]:shadow-lg data-[state=active]:shadow-brand-primary/20 text-slate-400 hover:text-slate-600"
          >
            Taxonomy Distribution
          </TabsTrigger>
        </TabsList>
        <TabsContent value="movement">
          <DataPanel 
            title="Temporal Movement Trends" 
            description="High-fidelity tracking of stock inflow and outflow across the network."
          >
            <div className="h-[400px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movementData}>
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
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                      fontWeight: 700
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stockIn"
                    stroke="#163625"
                    strokeWidth={3}
                    dot={{ fill: "#163625", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#163625", strokeWidth: 2 }}
                    name="Stock Inflow"
                  />
                  <Line
                    type="monotone"
                    dataKey="stockOut"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
                    name="Stock Outflow"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </DataPanel>
        </TabsContent>
        <TabsContent value="distribution">
          <DataPanel 
            title="Taxonomy Distribution" 
            description="Visualizing inventory capital allocation across primary departments."
          >
            <div className="h-[400px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={130}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#163625', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6'][index % 5]}
                        className="stroke-white stroke-2"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                      fontWeight: 700
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </DataPanel>
        </TabsContent>
      </Tabs>

      <DataPanel 
        title="Departmental Movement Analysis" 
        description="Comparative analysis of supply chain efficiency per category node."
      >
        <div className="h-[350px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryMovementData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                  fontWeight: 700
                }}
              />
              <Bar dataKey="stockIn" fill="#163625" radius={[0, 4, 4, 0]} name="Volume In" barSize={12} />
              <Bar dataKey="stockOut" fill="#ef4444" radius={[0, 4, 4, 0]} name="Volume Out" barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DataPanel>
    </div>
  );
}
