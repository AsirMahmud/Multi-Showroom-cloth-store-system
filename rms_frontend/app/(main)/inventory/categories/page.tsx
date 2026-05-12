"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCategories, useDeleteCategory } from "@/hooks/queries/useInventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/professional";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  Search,
  Tag,
  Package,
  MoreHorizontal,
  Edit3,
  Eye,
  Trash2,
  Calendar,
  BarChart3,
  TrendingUp,
  Box,
  DollarSign,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/types/inventory";
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
import { toast } from "sonner";
import { PageHeader, MetricCard, DataPanel } from "@/components/ui/professional";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [statsCategory, setStatsCategory] = useState<Category | null>(null);

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory.mutateAsync(categoryToDelete.id);
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error("Failed to delete category");
      console.error("Error deleting category:", error);
    } finally {
      setCategoryToDelete(null);
    }
  };

  // Filter categories based on search
  const filteredCategories = categories.filter((category: Category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics based on actual API fields
  const totalCategories = categories.length;
  const totalProducts = categories.reduce(
    (sum: number, category: Category) => sum + (category.product_count || 0),
    0
  );
  const categoriesWithChildren = categories.filter(
    (c: Category) => c.children && c.children.length > 0
  ).length;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-100 animate-pulse rounded-xl" />
            <div className="h-4 w-96 bg-slate-50 animate-pulse rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-[24px] bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-[32px] bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const CategoryCard = ({ category }: { category: Category }) => (
    <div className="group relative bg-white rounded-[32px] p-6 border border-slate-100 hover:shadow-2xl hover:shadow-brand-primary/5 transition-all duration-500 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-brand-primary/5 transition-colors">
            <Tag className="h-6 w-6 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 group-hover:text-brand-primary transition-colors">
              {category.name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] uppercase tracking-widest">
                {category.product_count || 0} Products
              </Badge>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl border-slate-100 shadow-xl p-2">
            <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer">
              <Link href={`/inventory/categories/${category.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer">
              <Link href={`/inventory/edit-category/${category.id}`}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit Category
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl py-2.5 cursor-pointer" onClick={() => { setStatsCategory(category); setIsStatsDialogOpen(true); }}>
              <BarChart3 className="mr-2 h-4 w-4" /> View Statistics
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2 bg-slate-50" />
            <DropdownMenuItem className="rounded-xl py-2.5 text-rose-600 cursor-pointer" onClick={() => setCategoryToDelete(category)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-50">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sub-Nodes</p>
          <p className="text-sm font-black text-slate-900">{category.children?.length || 0}</p>
        </div>
        <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-50">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Stock</p>
          <p className="text-sm font-black text-slate-900">{category.total_stock || 0}</p>
        </div>
      </div>

      {category.description && (
        <p className="text-xs font-medium text-slate-500 line-clamp-2 mb-6 h-8 italic">
          "{category.description}"
        </p>
      )}

      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Calendar className="h-3 w-3" />
          {new Date(category.created_at).toLocaleDateString()}
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Taxonomy Matrix"
        description="Logical classification system for global inventory organization."
        icon={<Tag className="h-6 w-6" />}
        actions={
          <Button
            onClick={() => router.push("/inventory/categories/add")}
            className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Register Category
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Global Categories"
          value={totalCategories}
          icon={<Tag className="h-5 w-5" />}
          tone="brand"
          helper="Total classification nodes"
        />
        <MetricCard
          label="Aggregate SKUs"
          value={totalProducts}
          icon={<Package className="h-5 w-5" />}
          tone="brand"
          helper="Total products across taxonomy"
        />
        <MetricCard
          label="Hybrid Nodes"
          value={categoriesWithChildren}
          icon={<Tag className="h-5 w-5" />}
          tone="indigo"
          helper="Categories with sub-nodes"
        />
      </div>

      <DataPanel title="Category Architecture" description="Manage your organizational hierarchy and taxonomy distribution.">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="SEARCH TAXONOMY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-slate-50/50 border-none rounded-xl focus-visible:ring-brand-primary font-bold text-xs placeholder:text-slate-300 uppercase tracking-widest"
            />
          </div>
        </div>

        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Null Results Detected"
            description="The current search manifest yielded no classification nodes. Try adjusting your parameters."
            icon={<Tag className="h-10 w-10" />}
            action={
              <Button 
                variant="outline" 
                className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-brand-primary/10 text-brand-primary hover:bg-brand-primary/5"
                onClick={() => setSearchQuery("")}
              >
                Clear Search Protocol
              </Button>
            }
          />
        )}
      </DataPanel>

      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-900">Decommission Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              This will permanently remove the category node from the taxonomy matrix. This action cannot be reverted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-slate-100">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-rose-600 hover:bg-rose-700 rounded-xl font-bold uppercase text-[10px] tracking-widest">Confirm Deletion</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Stats Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black text-slate-900">
              <BarChart3 className="h-6 w-6 text-brand-primary" />
              {statsCategory?.name} Node Statistics
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Granular breakdown of inventory and sales performance for this classification node.
            </DialogDescription>
          </DialogHeader>

          {statsCategory?.detailed_stats ? (
            <Tabs defaultValue="inventory" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-5 mb-8 bg-slate-50 p-1 rounded-2xl h-12">
                <TabsTrigger value="inventory" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest">
                  <Box className="h-3.5 w-3.5" /> Inventory
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest">
                  <TrendingUp className="h-3.5 w-3.5" /> Growth
                </TabsTrigger>
                <TabsTrigger value="breakdown" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest">
                  <Package className="h-3.5 w-3.5" /> Variants
                </TabsTrigger>
                <TabsTrigger value="products" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest">
                  <Search className="h-3.5 w-3.5" /> SKUs
                </TabsTrigger>
                <TabsTrigger value="financials" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest">
                  <DollarSign className="h-3.5 w-3.5" /> Capital
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inventory" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-brand-primary/5 rounded-2xl p-4 border border-brand-primary/10">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">Peak Volume SKU</p>
                    <p className="text-lg font-black text-slate-900 leading-tight mb-1">{statsCategory.detailed_stats.max_inventory.name || "N/A"}</p>
                    <p className="text-xs font-bold text-slate-500">Live Stock: <span className="text-brand-primary">{statsCategory.detailed_stats.max_inventory.stock}</span></p>
                  </div>

                  <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Critical Low SKU</p>
                    <p className="text-lg font-black text-slate-900 leading-tight mb-1">{statsCategory.detailed_stats.min_inventory.name || "N/A"}</p>
                    <p className="text-xs font-bold text-slate-500">Live Stock: <span className="text-rose-600">{statsCategory.detailed_stats.min_inventory.stock}</span></p>
                  </div>
                </div>

                <div className="h-[300px] w-full bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 shadow-inner">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Box className="h-3 w-3" /> Distribution Matrix
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsCategory.detailed_stats.color_breakdown}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="color" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                      <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 700 }} />
                      <Bar dataKey="total_stock" radius={[6, 6, 0, 0]} barSize={32}>
                        {statsCategory.detailed_stats.color_breakdown.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total Yield</p>
                    <p className="text-2xl font-black text-slate-900">{statsCategory.detailed_stats.performance.total_sold} <span className="text-xs font-bold text-slate-400">Units</span></p>
                  </div>
                  <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Revenue Node</p>
                    <p className="text-2xl font-black text-slate-900">${statsCategory.detailed_stats.performance.total_revenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Primary Color</p>
                    <p className="text-2xl font-black text-slate-900">{statsCategory.detailed_stats.performance.best_selling_color || "N/A"}</p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 shadow-inner">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Efficiency Analytics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Velocity Coefficient</span>
                      <span className="text-xs font-black text-slate-900">{(statsCategory.detailed_stats.performance.total_sold / (statsCategory.product_count || 1)).toFixed(1)} Sales/SKU</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mean Transactional Value</span>
                      <span className="text-xs font-black text-slate-900">${(statsCategory.detailed_stats.performance.total_revenue / (statsCategory.detailed_stats.performance.total_sold || 1)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="breakdown" className="space-y-6">
                <div className="bg-slate-50/50 rounded-[24px] p-6 border border-slate-100 shadow-inner">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Dimensional Availability</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {statsCategory.detailed_stats.size_breakdown.map((item) => (
                      <div key={item.size} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center group hover:border-brand-primary transition-all">
                        <span className="text-sm font-black text-slate-900 uppercase">{item.size}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.total_stock} SKUs</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="products" className="space-y-4">
                <div className="rounded-[24px] border border-slate-100 overflow-hidden bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU Node</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimensions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {statsCategory.detailed_stats.products_detail?.map((product) => (
                          <tr key={product.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4 text-xs font-black text-slate-900">{product.name}</td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant="secondary" className="bg-brand-primary/5 text-brand-primary border-none font-black text-[9px]">{product.total_stock}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-2">
                                {product.size_breakdown.map((sb) => (
                                  <div key={sb.size} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">{sb.size}:</span>
                                    <span className="text-[10px] font-black text-slate-900">{sb.total_stock}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financials" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cost Basis</p>
                    <p className="text-2xl font-black text-slate-900">${statsCategory.detailed_stats.financials?.total_investment.toLocaleString()}</p>
                  </div>
                  <div className="bg-brand-primary/5 rounded-2xl p-5 border border-brand-primary/10">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2">Exit Revenue</p>
                    <p className="text-2xl font-black text-slate-900">${statsCategory.detailed_stats.financials?.expected_revenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Net Potential</p>
                    <p className="text-2xl font-black text-slate-900">${statsCategory.detailed_stats.financials?.potential_profit.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 shadow-inner">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Margin Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected Margin</span>
                      <span className="text-lg font-black text-emerald-600">{((statsCategory.detailed_stats.financials?.potential_profit || 0) / (statsCategory.detailed_stats.financials?.expected_revenue || 1) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capital Efficiency (ROI)</span>
                      <span className="text-lg font-black text-brand-primary">{((statsCategory.detailed_stats.financials?.potential_profit || 0) / (statsCategory.detailed_stats.financials?.total_investment || 1) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <Box className="h-16 w-16 mb-4 opacity-10" />
              <p className="text-sm font-black uppercase tracking-widest">No detailed matrix data found</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
