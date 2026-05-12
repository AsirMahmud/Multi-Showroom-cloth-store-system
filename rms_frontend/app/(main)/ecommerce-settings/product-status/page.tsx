"use client";

import { useState } from "react";
import { PageHeader, DataPanel } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Star,
  TrendingUp,
  Sparkles,
  Filter,
  Save,
  RefreshCw,
  X,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Layout,
  Tag,
  Package,
  Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, useOnlineCategories } from "@/hooks/queries/useInventory";
import {
  useUpdateProductEcommerceStatus,
  useProductStatuses,
  useCreateProductStatus,
  useUpdateProductStatus,
  useDeleteProductStatus,
  ProductStatus
} from "@/hooks/queries/useEcommerce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { cn, getImageUrl } from "@/lib/utils";

interface StatusForm {
  name: string;
  display_on_home: boolean;
  display_order: number;
  is_active: boolean;
}

// Framer motion variants
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

export default function ProductStatusPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { toast } = useToast();

  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useProducts({
    page: currentPage,
    page_size: itemsPerPage,
    search: searchQuery,
    online_category: categoryFilter !== "all" ? [parseInt(categoryFilter)] : undefined,
  });

  const { data: statuses = [], isLoading: statusesLoading, refetch: refetchStatuses } = useProductStatuses();

  const createStatusMutation = useCreateProductStatus();
  const updateStatusMutation = useUpdateProductStatus();
  const deleteStatusMutation = useDeleteProductStatus();
  const updateProductMutation = useUpdateProductEcommerceStatus();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ProductStatus | null>(null);
  const [statusForm, setStatusForm] = useState<StatusForm>({
    name: "",
    display_on_home: true,
    display_order: 0,
    is_active: true
  });

  const transformedProducts = (productsData?.results || []).map((product: any) => {
    const rawStatuses = product.ecommerce_statuses || [];
    const normalizedStatuses = rawStatuses.map((s: any) => {
      if (typeof s === 'number' || typeof s === 'string') {
        const found = statuses.find(ms => ms.id === Number(s));
        return { id: Number(s), name: found?.name || `Section ${s}` };
      }
      return { id: s.id, name: s.name || `Section ${s.id}` };
    });

    const firstGalleryImage = product.galleries?.[0]?.images?.[0]?.image;
    const imageUrl = getImageUrl(firstGalleryImage || product.image_url || product.image);

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      image: imageUrl,
      category: product.category_name || "Uncategorized",
      price: product.retail_price,
      stock: product.stock_quantity,
      ecommerce_statuses: normalizedStatuses,
      assign_to_online: product.assign_to_online || false,
    };
  });

  const totalCount = productsData?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleToggleDynamicStatus = async (productId: number, statusId: number) => {
    const product = transformedProducts.find(p => p.id === productId);
    if (!product) return;

    const currentStatuses = product.ecommerce_statuses.map((s: any) => s.id);
    const newStatuses = currentStatuses.includes(statusId)
      ? currentStatuses.filter((id: number) => id !== statusId)
      : [...currentStatuses, statusId];

    try {
      await updateProductMutation.mutateAsync({
        productId,
        status: { ecommerce_statuses: newStatuses }
      });
      await refetchProducts();
      toast({ title: "Updated", description: "Product section assignment synchronized." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to synchronize assignment.", variant: "destructive" });
    }
  };

  const handleSaveStatus = async () => {
    try {
      if (editingStatus) {
        await updateStatusMutation.mutateAsync({ id: editingStatus.id, status: statusForm });
        toast({ title: "Success", description: "Section protocol updated." });
      } else {
        await createStatusMutation.mutateAsync(statusForm);
        toast({ title: "Success", description: "New section protocol established." });
      }
      setIsDialogOpen(false);
      setEditingStatus(null);
      resetStatusForm();
      refetchStatuses();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save section protocol.", variant: "destructive" });
    }
  };

  const handleDeleteStatus = async (id: number) => {
    try {
      await deleteStatusMutation.mutateAsync(id);
      toast({ title: "Success", description: "Section protocol terminated." });
      refetchStatuses();
    } catch (error) {
      toast({ title: "Error", description: "Termination failed.", variant: "destructive" });
    }
  };

  const resetStatusForm = () => {
    setStatusForm({
      name: "",
      display_on_home: true,
      display_order: 0,
      is_active: true
    });
  };

  const openEditDialog = (status: ProductStatus) => {
    setEditingStatus(status);
    setStatusForm({
      name: status.name,
      display_on_home: status.display_on_home,
      display_order: status.display_order,
      is_active: status.is_active
    });
    setIsDialogOpen(true);
  };

  const { data: categoriesData = [] } = useOnlineCategories();
  const categories = categoriesData.map((c: any) => ({ id: c.id, name: c.name }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <PageHeader
        title="Visual Merchandising"
        description="Curate home page sections and manage high-priority product visibility."
        icon={<Layout className="h-6 w-6" />}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingStatus(null); resetStatusForm(); } }}>
            <DialogTrigger asChild>
              <Button className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20">
                <Plus className="h-3.5 w-3.5 mr-2" />
                New Section
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl border-brand-primary/5 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter">{editingStatus ? "Update Protocol" : "Initialize Section"}</DialogTitle>
                <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configure dynamic home page segment.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section Designation</Label>
                  <Input value={statusForm.name} onChange={(e) => setStatusForm({ ...statusForm, name: e.target.value })} placeholder="e.g. Featured Collection" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Home Page Inclusion</Label>
                  <Switch checked={statusForm.display_on_home} onCheckedChange={(checked) => setStatusForm({ ...statusForm, display_on_home: checked })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority Weight (Order)</Label>
                  <Input type="number" value={statusForm.display_order} onChange={(e) => setStatusForm({ ...statusForm, display_order: parseInt(e.target.value) })} className="h-12 rounded-xl bg-slate-50 border-none font-black" />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Status</Label>
                  <Switch checked={statusForm.is_active} onCheckedChange={(checked) => setStatusForm({ ...statusForm, is_active: checked })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-black text-[10px] uppercase tracking-widest">Cancel</Button>
                <Button onClick={handleSaveStatus} className="bg-brand-primary text-brand-secondary font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg">Save Protocol</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <motion.div variants={item}>
        <DataPanel title="Active Segments" description="Configured dynamic blocks for the storefront landing page.">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {statuses.map((status: ProductStatus) => (
                <motion.div
                  key={status.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-4 rounded-2xl bg-white border border-brand-primary/5 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-sm text-brand-primary uppercase tracking-tight">{status.name}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge className={cn("text-[9px] font-black uppercase tracking-widest border-none", status.display_on_home ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400")}>
                          {status.display_on_home ? "Live" : "Standby"}
                        </Badge>
                        <Badge className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-widest border-none">
                          Rank: {status.display_order}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(status)} className="h-8 w-8 rounded-lg hover:bg-slate-50"><Edit2 className="h-3.5 w-3.5 text-slate-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteStatus(status.id)} className="h-8 w-8 rounded-lg hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5 text-rose-400" /></Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </DataPanel>
      </motion.div>

      <motion.div variants={item}>
        <DataPanel title="Product Matrix" description="Map inventory units to specified storefront segments.">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                placeholder="Query by Name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-10 bg-slate-50 border-none rounded-xl font-bold"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-12 w-full md:w-[240px] bg-slate-50 border-none rounded-xl font-black text-[10px] uppercase tracking-widest">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-primary/5">
                <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-widest">Full Catalog</SelectItem>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()} className="font-bold text-[10px] uppercase tracking-widest">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Unit Identifier</th>
                  <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Classification</th>
                  <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory</th>
                  <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Segments</th>
                  <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Control</th>
                </tr>
              </thead>
              <tbody>
                {productsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-50"><td colSpan={5} className="py-4"><Skeleton className="h-12 w-full rounded-xl" /></td></tr>
                  ))
                ) : (
                  transformedProducts.map((product) => (
                    <tr key={product.id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 bg-white">
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-brand-primary">{product.name}</div>
                            <div className="text-[10px] font-bold text-slate-400">SKU: {product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge className="bg-slate-100 text-slate-600 border-none text-[9px] font-black uppercase tracking-widest">{product.category}</Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-600">{product.stock} Units</span>
                          <span className={cn("text-[9px] font-black uppercase tracking-widest", product.stock > 0 ? "text-emerald-500" : "text-rose-500")}>
                            {product.stock > 0 ? "In Stock" : "Depleted"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {product.ecommerce_statuses.map((s: any) => (
                            <Badge key={s.id} className="bg-indigo-50 text-indigo-700 border-none text-[9px] font-black uppercase tracking-widest py-0.5 pl-2 pr-1 gap-1">
                              {s.name}
                              <button onClick={() => handleToggleDynamicStatus(product.id, s.id)} className="hover:bg-indigo-200 rounded-full p-0.5"><X className="h-2 w-2" /></button>
                            </Badge>
                          ))}
                          {product.ecommerce_statuses.length === 0 && <span className="text-[9px] font-bold text-slate-300 italic">No Assignments</span>}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-white font-black text-[9px] uppercase tracking-widest border border-transparent hover:border-brand-primary/10">
                              Map Segment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl border-brand-primary/5 shadow-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-black uppercase tracking-tighter">Segment Mapping</DialogTitle>
                              <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Map <strong>{product.name}</strong> to storefront segments.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto">
                              {statuses.filter((s: any) => s.is_active).map((status: any) => {
                                const isSelected = product.ecommerce_statuses.some((s: any) => s.id === status.id);
                                return (
                                  <div key={status.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-white border border-transparent hover:border-brand-primary/5 transition-all">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600">{status.name}</Label>
                                    <Switch checked={isSelected} onCheckedChange={() => handleToggleDynamicStatus(product.id, status.id)} />
                                  </div>
                                );
                              })}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-slate-50">
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page {currentPage} of {totalPages}</span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </DataPanel>
      </motion.div>
    </motion.div>
  );
}
