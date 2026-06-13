"use client";
import { use } from "react";
import {
  ArrowLeft,
  Calendar,
  Download,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  CreditCard,
  Package,
  Crown,
  Trophy,
  Medal,
  Award,
  Star,
  AlertTriangle,
  DollarSign,
  Percent,
  Clock,
  Users,
  Activity,
  History,
  Settings,
  StickyNote
} from "lucide-react";
import Link from "next/link";
import { useCustomer } from "@/hooks/queries/use-customer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard, DataPanel, PageHeader } from "@/components/ui/professional";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";

const rankingIcons = [
  { icon: Crown, color: "text-yellow-500", bgColor: "bg-yellow-100", label: "Top 5" },
  { icon: Trophy, color: "text-gray-500", bgColor: "bg-gray-100", label: "Top 10" },
  { icon: Medal, color: "text-amber-600", bgColor: "bg-amber-100", label: "Top 20" },
  { icon: Award, color: "text-blue-500", bgColor: "bg-blue-100", label: "Top 30" },
  { icon: Star, color: "text-purple-500", bgColor: "bg-purple-100", label: "Top 50" },
];

const getRankingIcon = (ranking: number) => {
  if (ranking <= 5) return rankingIcons[0];
  if (ranking <= 10) return rankingIcons[1];
  if (ranking <= 20) return rankingIcons[2];
  if (ranking <= 30) return rankingIcons[3];
  if (ranking <= 50) return rankingIcons[4];
  if (ranking <= 100) return { icon: Users, color: "text-green-500", bgColor: "bg-green-100", label: "Top 100" };
  return null;
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: customer, isLoading } = useCustomer(parseInt(id));

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-40 rounded-[32px]" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[24px]" />
          ))}
        </div>
        <Skeleton className="h-[500px] rounded-[32px]" />
      </div>
    );
  }

  if (!customer) {
    return (
      <DataPanel title="System Conflict" description="Protocol failure while retrieving customer node.">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <p className="text-slate-600 font-bold">Customer record not found.</p>
          <Button variant="outline" className="mt-4 rounded-xl" asChild>
            <Link href="/customers">Return to Base</Link>
          </Button>
        </div>
      </DataPanel>
    );
  }

  const isTopCustomer = customer.is_top_customer;
  const ranking = customer.ranking;
  const rankingIcon = ranking ? getRankingIcon(ranking) : null;
  const RankingIconComponent = rankingIcon?.icon;

  const dueDetails = customer.purchase_history?.reduce((acc: any, sale: any) => {
    const amountDue = parseFloat(sale.amount_due?.toString() || '0') || 0;
    if (amountDue > 0) {
      acc.totalDue += amountDue;
      acc.dueSales.push(sale);
    }
    return acc;
  }, { totalDue: 0, dueSales: [] }) || { totalDue: 0, dueSales: [] };

  const discountDetails = customer.purchase_history?.reduce((acc: any, sale: any) => {
    const discount = parseFloat(sale.discount?.toString() || '0') || 0;
    const total = parseFloat(sale.total_amount?.toString() || '0') || 0;
    if (total > 0) {
      acc.totalDiscount += discount;
      acc.totalSales += total;
      acc.salesWithDiscount += discount > 0 ? 1 : 0;
      acc.totalSalesCount += 1;
    }
    return acc;
  }, { totalDiscount: 0, totalSales: 0, salesWithDiscount: 0, totalSalesCount: 0 }) || { totalDiscount: 0, totalSales: 0, salesWithDiscount: 0, totalSalesCount: 0 };

  const averageDiscount = customer.average_discount || (discountDetails.totalSales > 0 ? (discountDetails.totalDiscount / discountDetails.totalSales) * 100 : 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Client Intelligence"
        description="Detailed behavioral and fiscal analysis of client node."
        icon={<Users className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-10 rounded-xl px-4 font-black text-[10px] uppercase tracking-widest border-slate-100 bg-white/50 hover:bg-white shadow-sm transition-all" asChild>
              <Link href="/customers">
                <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                Back to Grid
              </Link>
            </Button>
            <Button className="h-10 rounded-xl px-6 font-black text-[10px] uppercase tracking-widest bg-brand-primary text-white shadow-lg shadow-brand-primary/20 transition-all">
              Initiate Transaction
            </Button>
          </div>
        }
      />

      <motion.div variants={item} className="bg-white/50 backdrop-blur-md border border-slate-100 p-8 rounded-[32px] shadow-sm flex flex-col lg:flex-row gap-8 items-center">
        <div className="relative">
          <Avatar className="h-28 w-28 border-4 border-white shadow-xl ring-1 ring-slate-100">
            <AvatarFallback className="bg-brand-secondary text-brand-primary text-3xl font-black">
              {`${customer.first_name || ""} ${customer.last_name || ""}`.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          {isTopCustomer && (
            <div className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-full shadow-lg border-2 border-white">
              <Crown className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 text-center lg:text-left space-y-2">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <h1 className="text-3xl font-black text-brand-primary tracking-tight">{customer.first_name} {customer.last_name}</h1>
            {isTopCustomer && (
              <Badge className="bg-yellow-50 text-yellow-600 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">
                Elite Tier Associate
              </Badge>
            )}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Identity trace active since {new Date(customer.created_at).toLocaleDateString()}
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{customer.email || "No Node Registered"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Phone className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{customer.address || "Location Encrypted"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[200px]">
          {ranking && (
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">Global Ranking</div>
                <div className="text-xs font-black text-indigo-700">Position #{ranking}</div>
              </div>
              {RankingIconComponent && <RankingIconComponent className="h-5 w-5 text-indigo-500 opacity-50" />}
            </div>
          )}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">Status Protocol</div>
              <div className="text-xs font-black text-emerald-700">{customer.is_active ? "Verified" : "Stagnant"}</div>
            </div>
            <Activity className="h-5 w-5 text-emerald-500 opacity-50" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Gross Settlement"
            value={formatCurrency(customer.total_sales)}
            icon={<DollarSign className="h-5 w-5" />}
            tone="brand"
            helper={`${customer.sales_count} Cumulative Orders`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Outstanding Liability"
            value={formatCurrency(dueDetails.totalDue)}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone={dueDetails.totalDue > 0 ? "rose" : "emerald"}
            helper={`${dueDetails.dueSales.length} Active Debts`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Yield Mean"
            value={formatCurrency(customer.sales_count > 0 ? customer.total_sales / customer.sales_count : 0)}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="indigo"
            helper="Yield per transaction"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Efficiency Bonus"
            value={`${averageDiscount.toFixed(1)}%`}
            icon={<Percent className="h-5 w-5" />}
            tone="brand"
            helper="Aggregate discount applied"
          />
        </motion.div>
      </div>

      <Tabs defaultValue="purchases" className="space-y-8">
        <TabsList className="bg-slate-50 border-none p-1 h-12 shadow-inner rounded-2xl flex justify-start gap-1 w-fit">
          <TabsTrigger value="purchases" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            Transaction History
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            Behavioral Profile
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            Intelligence Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="m-0 focus-visible:outline-none">
          <DataPanel title="Transaction Matrix" description="Exhaustive chronological log of client settlements and volume delta.">
            <div className="space-y-8 pt-4">
              {customer.purchase_history.map((purchase: any) => (
                <div key={purchase.id} className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-[32px] overflow-hidden hover:border-brand-primary/10 transition-all group">
                  <div className="p-6 bg-slate-50/50 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-brand-primary">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-700 uppercase tracking-tighter">Protocol #{purchase.id}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(purchase.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-slate-200 text-slate-500 font-black text-[9px] uppercase tracking-widest h-7">
                        {purchase.payment_method}
                      </Badge>
                      <Badge className={cn(
                        "border-none font-black text-[9px] uppercase tracking-widest h-7",
                        purchase.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                      )}>
                        {purchase.status}
                      </Badge>
                      {purchase.amount_due && purchase.amount_due > 0 && (
                        <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[9px] uppercase tracking-widest h-7">
                          Due: {formatCurrency(parseFloat(purchase.amount_due))}
                        </Badge>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Settlement</div>
                      <div className="text-lg font-black text-brand-primary">{formatCurrency(parseFloat(purchase.total_amount))}</div>
                    </div>
                  </div>

                  <div className="p-6 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-50 hover:bg-transparent">
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-3">SKU Identifier</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-3">Configuration</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-3 text-right">Volume</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-3 text-right">Unit Yield</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-3 text-right">Total Yield</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchase.items.map((item: any, index: number) => (
                          <TableRow key={index} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                            <TableCell className="py-4 text-xs font-black text-slate-700">{item.product_name}</TableCell>
                            <TableCell className="py-4">
                              <div className="flex gap-2">
                                <Badge variant="outline" className="h-5 px-2 border-slate-100 text-[9px] font-bold text-slate-400">{item.size}</Badge>
                                <Badge variant="outline" className="h-5 px-2 border-slate-100 text-[9px] font-bold text-slate-400">{item.color}</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-right text-xs font-bold text-slate-500">{item.quantity} Units</TableCell>
                            <TableCell className="py-4 text-right text-xs font-bold text-slate-500">{formatCurrency(parseFloat(item.unit_price))}</TableCell>
                            <TableCell className="py-4 text-right text-xs font-black text-brand-primary">{formatCurrency(parseFloat(item.total))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          </DataPanel>
        </TabsContent>

        <TabsContent value="preferences" className="m-0 focus-visible:outline-none">
          <DataPanel title="Behavioral Preferences" description="Algorithmic prediction of client interests and preferred categories.">
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <Activity className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-black text-[10px] uppercase tracking-widest">Neural profiling in progress...</p>
            </div>
          </DataPanel>
        </TabsContent>

        <TabsContent value="notes" className="m-0 focus-visible:outline-none">
          <DataPanel title="Intelligence Log" description="Contextual annotations and administrative observations.">
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <StickyNote className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-black text-[10px] uppercase tracking-widest">No Intelligence nodes recorded.</p>
            </div>
          </DataPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
