"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader, DataPanel, MetricCard } from "@/components/ui/professional";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  User,
  ShoppingBag,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  BarChart3,
  MoreHorizontal,
  Clock,
  Zap,
  Globe,
  Loader2
} from "lucide-react";
import { onlinePreordersApi, type OnlinePreorder } from "@/lib/api/onlinePreorder";
import { OrderDetailsSheet } from "@/components/online-preorders/order-details-sheet";
import { OnlinePreorderVerificationModal } from "@/components/online-preorders/verification-modal";
import { ManualOrderForm } from "@/components/online-preorders/manual-order-form";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";
import { useOnlinePreorderAnalytics } from "@/hooks/queries/use-reports";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function OnlinePreordersPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OnlinePreorder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OnlinePreorder | null>(null);
  const [editingOrder, setEditingOrder] = useState<OnlinePreorder | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<OnlinePreorder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [verificationOrder, setVerificationOrder] = useState<OnlinePreorder | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);

  const { toast } = useToast();
  const debouncedSearch = useDebounce(search, 500);

  const dateRange = useMemo(() => {
    const now = new Date();
    return { from: new Date(2020, 0, 1), to: now };
  }, []);

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useOnlinePreorderAnalytics(dateRange);

  const stats = useMemo(() => {
    const totalOrders = rows.length;
    const totalRevenue = rows
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const completedCount = rows.filter(o => o.status === 'COMPLETED').length;
    const averageOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0;
    const totalProfit = rows
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + Number((o as any).profit || 0), 0);

    return {
      totalOrders,
      totalRevenue,
      completedCount,
      averageOrderValue,
      totalProfit,
    };
  }, [rows]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await onlinePreordersApi.getAll(status, debouncedSearch);
      const data = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setRows(data as OnlinePreorder[]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order: OnlinePreorder) => {
    setEditingOrder(order);
    setIsSheetOpen(false);
    setActiveTab("manual");
  };

  const handleStartVerification = (order: OnlinePreorder) => {
    setVerificationOrder(order);
    setIsVerificationOpen(true);
  };

  const clearEditing = () => {
    setEditingOrder(null);
    setActiveTab("orders");
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await onlinePreordersApi.delete(orderToDelete.id);
      toast({ title: "Success", description: "Order deleted successfully" });
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      void loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [status, debouncedSearch]);

  const getStatusBadge = (s: string) => {
    const config: any = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      DELIVERED: "bg-indigo-100 text-indigo-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return <Badge className={cn("border-none capitalize text-[9px] font-black tracking-widest", config[s] || "bg-gray-100")}>{s.toLowerCase()}</Badge>;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <PageHeader
        title="Storefront Logistics"
        description="Monitor and optimize fulfillment cycles for global ecommerce transactions."
        icon={<Globe className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-10 bg-white rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-widest" onClick={loadData}>
              <RefreshCw className={cn("h-3.5 w-3.5 mr-2", loading && "animate-spin")} />
              Sync Stream
            </Button>
            <Button className="h-10 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20" onClick={() => { setEditingOrder(null); setActiveTab("manual"); }}>
              <Plus className="h-3.5 w-3.5 mr-2" />
              New Order
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Order Volume"
            value={(isLoadingAnalytics ? "..." : (analyticsData?.total_orders ?? stats.totalOrders)).toString()}
            icon={<ShoppingBag className="h-5 w-5" />}
            tone="indigo"
            helper="All active preorders"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Gross Revenue"
            value={formatCurrency(Number(analyticsData?.total_revenue ?? stats.totalRevenue))}
            icon={<DollarSign className="h-5 w-5" />}
            tone="emerald"
            helper="Completed COD cycle"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Fulfillment Count"
            value={(isLoadingAnalytics ? "..." : (analyticsData?.total_sales_count ?? stats.completedCount)).toString()}
            icon={<Package className="h-5 w-5" />}
            tone="brand"
            helper="Verified delivery"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="AOV Velocity"
            value={formatCurrency(Number(analyticsData?.average_order_value ?? stats.averageOrderValue))}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="indigo"
            helper="Avg order yield"
          />
        </motion.div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== "manual") setEditingOrder(null); }} className="w-full">
        <TabsList className="bg-slate-50 border-none p-1 h-12 shadow-inner rounded-2xl mb-8 flex justify-start gap-1 w-fit">
          <TabsTrigger value="orders" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            <ShoppingBag className="w-3.5 h-3.5 mr-2" /> Transaction Log
          </TabsTrigger>
          <TabsTrigger value="manual" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            {editingOrder ? <Edit className="w-3.5 h-3.5 mr-2" /> : <Plus className="w-3.5 h-3.5 mr-2" />}
            {editingOrder ? "Edit Order" : "Manual Input"}
          </TabsTrigger>
          <TabsTrigger value="customers" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm px-6 font-black text-[10px] uppercase tracking-widest transition-all">
            <User className="w-3.5 h-3.5 mr-2" /> Core Clients
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="orders" key="orders" className="m-0 focus-visible:outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <DataPanel 
                title="Logistics Stream" 
                description="Live tactical view of ecommerce fulfillment pipeline."
                actions={
                  <div className="flex items-center gap-4">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="Search manifests..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-white border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-40 h-9 bg-white border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100">
                        <SelectItem value="all" className="text-[10px] font-black uppercase">All Orders</SelectItem>
                        <SelectItem value="PENDING" className="text-[10px] font-black uppercase">Pending</SelectItem>
                        <SelectItem value="CONFIRMED" className="text-[10px] font-black uppercase">Confirmed</SelectItem>
                        <SelectItem value="DELIVERED" className="text-[10px] font-black uppercase">Delivered</SelectItem>
                        <SelectItem value="COMPLETED" className="text-[10px] font-black uppercase">Completed</SelectItem>
                        <SelectItem value="CANCELLED" className="text-[10px] font-black uppercase">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                }
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Visuals</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Manifest ID</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Recipient</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 text-center">Items</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Valuation</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6">Timestamp</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-6 text-right">Ops</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((o) => (
                        <TableRow
                          key={o.id}
                          className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer"
                          onClick={() => { setSelectedOrder(o); setIsSheetOpen(true); }}
                        >
                          <TableCell className="py-5">
                            <div className="flex -space-x-4 items-center">
                              {(o.items?.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="w-12 h-16 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-slate-100 shrink-0">
                                  <img src={item.product_image} className="w-full h-full object-cover" alt="" />
                                </div>
                              )) || <div className="w-12 h-16 rounded-lg bg-slate-100 border-2 border-white shadow-sm" />)}
                              {o.items && o.items.length > 3 && (
                                <div className="w-10 h-10 rounded-full bg-brand-primary text-brand-secondary flex items-center justify-center text-[10px] font-black z-10 shadow-lg">
                                  +{o.items.length - 3}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-5 font-black text-brand-primary text-xs">#{o.id}</TableCell>
                          <TableCell className="py-5">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-700">{o.customer_name}</span>
                              <span className="text-[10px] font-bold text-slate-400 tracking-tight">{o.customer_phone}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 text-center">
                            <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-md text-slate-500">{o.items?.length || 0}</span>
                          </TableCell>
                          <TableCell className="py-5 font-black text-xs text-slate-900">{formatCurrency(Number(o.total_amount))}</TableCell>
                          <TableCell className="py-5">{getStatusBadge(o.status)}</TableCell>
                          <TableCell className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {format(new Date(o.created_at), "MMM dd, HH:mm")}
                          </TableCell>
                          <TableCell className="py-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 shadow-sm transition-all"><MoreHorizontal className="h-3.5 w-3.5 text-slate-400" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52 rounded-2xl border-brand-primary/5 shadow-2xl p-2">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3">Operational Logic</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-50" />
                                <DropdownMenuItem className="rounded-xl h-10 font-bold text-[11px] px-3 focus:bg-brand-primary/5 focus:text-brand-primary" onClick={() => { setSelectedOrder(o); setIsSheetOpen(true); }}><Edit className="mr-2 h-3.5 w-3.5" /> Modify Protocol</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl h-10 font-bold text-[11px] px-3 focus:bg-emerald-50 focus:text-emerald-600" onClick={() => handleStartVerification(o)}><Zap className="mr-2 h-3.5 w-3.5" /> Direct Verification</DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-50" />
                                <DropdownMenuItem className="rounded-xl h-10 font-bold text-[11px] px-3 focus:bg-rose-50 focus:text-rose-600 text-rose-500" onClick={(e) => { e.stopPropagation(); setOrderToDelete(o); setDeleteDialogOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> Terminate Order</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="py-24 text-center">
                            <ShoppingBag className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Null Log Detected</h3>
                            <p className="text-xs text-slate-300 font-bold mt-1 uppercase tracking-tighter">Awaiting new storefront conversions.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </DataPanel>
            </motion.div>
          </TabsContent>

          <TabsContent value="manual" key="manual" className="m-0 focus-visible:outline-none">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <ManualOrderForm
                initialData={editingOrder || undefined}
                onSuccess={() => { clearEditing(); void loadData(); }}
                onCancel={clearEditing}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="customers" key="customers" className="m-0 focus-visible:outline-none">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DataPanel title="Client Database" description="High-velocity online client behavioral history.">
                <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50">
                  <User className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Client Mapping Initializing</h3>
                  <p className="text-xs text-slate-300 font-bold mt-1 uppercase tracking-tighter">Syncing historical storefront engagement data.</p>
                </div>
              </DataPanel>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      <OrderDetailsSheet
        order={selectedOrder}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onRefresh={() => { void loadData(); setIsSheetOpen(false); }}
        onEdit={handleEdit}
        onStartVerification={handleStartVerification}
      />

      <OnlinePreorderVerificationModal
        order={verificationOrder}
        open={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        onCompleted={() => { void loadData(); }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tighter text-slate-900">Confirm Termination</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold text-slate-500 leading-relaxed">
              You are about to terminate order #{orderToDelete?.id}. This action will purge the manifest from the active stream permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-xl h-12 font-black text-[10px] uppercase tracking-widest border-none bg-slate-100">Abort</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl h-12 font-black text-[10px] uppercase tracking-widest bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200"
            >
              {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : "Execute Deletion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
