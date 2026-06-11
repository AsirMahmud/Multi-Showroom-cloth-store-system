"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader, DataPanel, MetricCard } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Percent,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Package,
  FolderTree,
  Check,
  ChevronsUpDown,
  RefreshCw,
  Info,
  TrendingUp,
  Target,
  Zap,
  Globe,
  Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn, formatCurrency } from "@/lib/utils";
import {
  useDiscounts,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount
} from "@/hooks/queries/useEcommerce";
import { useInfiniteProducts } from "@/hooks/queries/useInventory";
import { useDebounce } from "@/hooks/use-debounce";
import { Discount } from "@/lib/api/ecommerce";
import { categoriesApi, onlineCategoriesApi } from "@/lib/api/inventory";
import { Category, Product } from "@/types/inventory";

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

export default function DiscountManagementPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openProductCombobox, setOpenProductCombobox] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "APP_WIDE",
    value: "",
    startDate: "",
    endDate: "",
    description: "",
    categories: [] as string[],
    onlineCategories: [] as string[],
    products: [] as string[],
  });

  const [productSearch, setProductSearch] = useState("");
  const [selectedProductsDetails, setSelectedProductsDetails] = useState<Product[]>([]);
  const debouncedProductSearch = useDebounce(productSearch, 500);
  const observerTarget = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  // Data for selectors
  const [categories, setCategories] = useState<Category[]>([]);
  const [onlineCategories, setOnlineCategories] = useState<Category[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Use React Query hooks
  const { data: discounts = [], isLoading: isLoadingDiscounts } = useDiscounts();
  const createDiscountMutation = useCreateDiscount();
  const updateDiscountMutation = useUpdateDiscount();
  const deleteDiscountMutation = useDeleteDiscount();

  const {
    data: productsData,
    fetchNextPage: fetchNextProducts,
    hasNextPage: hasMoreProducts,
    isFetchingNextPage: isFetchingMoreProducts,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useInfiniteProducts(
    { search: debouncedProductSearch },
    {
      placeholderData: (previousData: any) => previousData,
      enabled: true
    }
  );

  const allProducts = productsData?.pages.flatMap(page => page.results) || [];
  const isLoading = isLoadingDiscounts;

  // Load categories for selectors
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [cats, onlineCats] = await Promise.all([
          categoriesApi.getAll(),
          onlineCategoriesApi.getAll(),
        ]);

        const catsData = Array.isArray(cats) ? cats : (cats as any).results || [];
        const onlineCatsData = Array.isArray(onlineCats) ? onlineCats : (onlineCats as any).results || [];

        setCategories(catsData);
        setOnlineCategories(onlineCatsData);
      } catch (error) {
        console.error('Error loading options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  // Set up infinite scroll observer for products
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreProducts && !isFetchingMoreProducts) {
          fetchNextProducts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMoreProducts, isFetchingMoreProducts, fetchNextProducts]);

  const resetForm = () => {
    setFormData({
      name: "",
      type: "APP_WIDE",
      value: "",
      startDate: "",
      endDate: "",
      description: "",
      categories: [],
      onlineCategories: [],
      products: [],
    });
    setSelectedProductsDetails([]);
  };

  const handleCreateDiscount = async () => {
    if (!formData.name || !formData.value || !formData.startDate || !formData.endDate) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (formData.type === "CATEGORY" && formData.categories.length === 0 && formData.onlineCategories.length === 0) {
      toast({ title: "Error", description: "Please select at least one category", variant: "destructive" });
      return;
    }
    if (formData.type === "PRODUCT" && formData.products.length === 0) {
      toast({ title: "Error", description: "Please select at least one product", variant: "destructive" });
      return;
    }

    try {
      await createDiscountMutation.mutateAsync({
        name: formData.name,
        discount_type: formData.type as 'APP_WIDE' | 'CATEGORY' | 'PRODUCT',
        value: parseFloat(formData.value),
        start_date: formData.startDate,
        end_date: formData.endDate,
        description: formData.description,
        is_active: true,
        status: 'ACTIVE',
        categories: formData.categories.map(c => Number(c)),
        online_categories: formData.onlineCategories.map(c => Number(c)),
        products: formData.products.map(p => Number(p)),
      });

      resetForm();
      setIsCreating(false);
      toast({ title: "Success", description: "Discount created successfully!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create discount", variant: "destructive" });
    }
  };

  const handleEditDiscount = (id: number) => {
    const discount = discounts.find((d: Discount) => d.id === id);
    if (discount) {
      const formatDate = (dateStr: string) => dateStr ? dateStr.split('T')[0] : "";

      setFormData({
        name: discount.name,
        type: discount.discount_type,
        value: discount.value.toString(),
        startDate: formatDate(discount.start_date),
        endDate: formatDate(discount.end_date),
        description: discount.description || "",
        categories: discount.categories?.map(id => id.toString()) || [],
        onlineCategories: discount.online_categories?.map(id => id.toString()) || [],
        products: discount.products?.map(id => id.toString()) || [],
      });

      if ((discount as any).products_detail) {
        setSelectedProductsDetails((discount as any).products_detail);
      }

      setEditingId(id);
      setProductSearch("");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleUpdateDiscount = async () => {
    if (!formData.name || !formData.value || !formData.startDate || !formData.endDate) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      await updateDiscountMutation.mutateAsync({
        id: editingId!,
        name: formData.name,
        discount_type: formData.type as 'APP_WIDE' | 'CATEGORY' | 'PRODUCT',
        value: parseFloat(formData.value),
        start_date: formData.startDate,
        end_date: formData.endDate,
        description: formData.description,
        categories: formData.categories.map(c => Number(c)),
        online_categories: formData.onlineCategories.map(c => Number(c)),
        products: formData.products.map(p => Number(p)),
      });

      resetForm();
      setEditingId(null);
      setSelectedProductsDetails([]);
      toast({ title: "Success", description: "Discount updated successfully!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update discount", variant: "destructive" });
    }
  };

  const handleDeleteDiscount = async (id: number) => {
    try {
      await deleteDiscountMutation.mutateAsync(id);
      toast({ title: "Success", description: "Discount deleted successfully!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete discount", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "active") return <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[10px] uppercase tracking-widest">Active</Badge>;
    if (s === "expired") return <Badge className="bg-rose-100 text-rose-800 border-none font-black text-[10px] uppercase tracking-widest">Expired</Badge>;
    if (s === "scheduled") return <Badge className="bg-blue-100 text-blue-800 border-none font-black text-[10px] uppercase tracking-widest">Scheduled</Badge>;
    return <Badge className="bg-slate-100 text-slate-800 border-none font-black text-[10px] uppercase tracking-widest">{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "APP_WIDE": return <Badge className="bg-indigo-50 text-indigo-700 border-none font-black text-[10px] uppercase tracking-widest">Global</Badge>;
      case "CATEGORY": return <Badge className="bg-blue-50 text-blue-700 border-none font-black text-[10px] uppercase tracking-widest">Category</Badge>;
      case "PRODUCT": return <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[10px] uppercase tracking-widest">Product</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const displayProducts = [...allProducts];
  formData.products.forEach(id => {
    if (!displayProducts.find(p => p.id.toString() === id)) {
      const detail = selectedProductsDetails.find(p => p.id.toString() === id);
      if (detail) {
        displayProducts.push(detail);
      } else {
        const discount = editingId ? (discounts as any).find((d: any) => d.id === editingId) : null;
        const existingDetail = discount?.products_detail?.find((pd: any) => pd.id.toString() === id);
        if (existingDetail) displayProducts.push(existingDetail);
      }
    }
  });

  const getTargetName = (discount: any) => {
    if (discount.discount_type === "APP_WIDE") return "All Products";
    if (discount.discount_type === "CATEGORY") {
      const names: string[] = [];
      if (discount.online_categories_detail?.length > 0) discount.online_categories_detail.forEach((c: any) => names.push(c.name));
      if (discount.categories_detail?.length > 0) discount.categories_detail.forEach((c: any) => names.push(c.name));
      return names.length > 0 ? names.join(", ") : "Multi-Category";
    }
    if (discount.discount_type === "PRODUCT") {
      const names: string[] = [];
      if (discount.products_detail?.length > 0) discount.products_detail.forEach((p: any) => names.push(p.name));
      return names.length > 0 ? names.join(", ") : "Multi-Product";
    }
    return "-";
  };

  const getProductImage = (product: Product | undefined) => {
    if (!product) return "/placeholder.svg";
    const img = product.image || product.first_variation_image;
    if (!img) return "/placeholder.svg";
    if (img.startsWith("/")) return `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}${img}`;
    return img;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <PageHeader
        title="Discounts"
        description="Create and manage storewide, category, and product discounts."
        icon={<Percent className="h-6 w-6" />}
        actions={
          <Button
            onClick={() => { setIsCreating(true); setEditingId(null); resetForm(); }}
            className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            New Campaign
          </Button>
        }
      />

      <Alert className="bg-blue-50/50 backdrop-blur-xl border-blue-100 rounded-2xl p-4 shadow-premium">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-xs font-bold text-blue-800 uppercase tracking-widest">
          Discount Hierarchy: Product (High) &gt; Category (Mid) &gt; Global (Low).
        </AlertDescription>
      </Alert>

      {(isCreating || editingId) && (
        <motion.div variants={item}>
          <DataPanel 
            title={editingId ? "Edit discount" : "Create a discount"}
            description="Choose where the discount applies, its value, and the active dates."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Summer Solstice Sale"
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Targeting Vector</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    type: value,
                    categories: [],
                    onlineCategories: [],
                    products: []
                  })}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-black text-[10px] uppercase tracking-widest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-brand-primary/5">
                    <SelectItem value="APP_WIDE" className="font-bold text-[10px] uppercase tracking-widest"><div className="flex items-center gap-2"><Globe className="w-3 h-3"/> Global</div></SelectItem>
                    <SelectItem value="CATEGORY" className="font-bold text-[10px] uppercase tracking-widest"><div className="flex items-center gap-2"><FolderTree className="w-3 h-3"/> Category</div></SelectItem>
                    <SelectItem value="PRODUCT" className="font-bold text-[10px] uppercase tracking-widest"><div className="flex items-center gap-2"><Tag className="w-3 h-3"/> Product</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Value (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 border-none font-black pl-10"
                    placeholder="0"
                  />
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                </div>
              </div>

              {formData.type === "CATEGORY" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Retail Categories</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-12 justify-between rounded-xl bg-slate-50 border-none font-bold text-xs">
                          {formData.categories.length > 0 ? `${formData.categories.length} Selected` : "Select..."}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 rounded-2xl border-brand-primary/5 shadow-2xl">
                        <Command>
                          <CommandInput placeholder="Search..." />
                          <CommandList>
                            <CommandEmpty>No results</CommandEmpty>
                            <CommandGroup>
                              {categories.map((cat) => (
                                <CommandItem
                                  key={cat.id}
                                  onSelect={() => {
                                    const current = [...formData.categories];
                                    const idx = current.indexOf(cat.id.toString());
                                    if (idx > -1) current.splice(idx, 1); else current.push(cat.id.toString());
                                    setFormData({ ...formData, categories: current });
                                  }}
                                  className="font-bold text-xs"
                                >
                                  <div className={cn("mr-2 h-4 w-4 border rounded", formData.categories.includes(cat.id.toString()) && "bg-brand-primary border-brand-primary")} />
                                  {cat.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Online Categories</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-12 justify-between rounded-xl bg-slate-50 border-none font-bold text-xs">
                          {formData.onlineCategories.length > 0 ? `${formData.onlineCategories.length} Selected` : "Select..."}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 rounded-2xl border-brand-primary/5 shadow-2xl">
                        <Command>
                          <CommandInput placeholder="Search..." />
                          <CommandList>
                            <CommandEmpty>No results</CommandEmpty>
                            <CommandGroup>
                              {onlineCategories.map((cat) => (
                                <CommandItem
                                  key={cat.id}
                                  onSelect={() => {
                                    const current = [...formData.onlineCategories];
                                    const idx = current.indexOf(cat.id.toString());
                                    if (idx > -1) current.splice(idx, 1); else current.push(cat.id.toString());
                                    setFormData({ ...formData, onlineCategories: current });
                                  }}
                                  className="font-bold text-xs"
                                >
                                  <div className={cn("mr-2 h-4 w-4 border rounded", formData.onlineCategories.includes(cat.id.toString()) && "bg-brand-primary border-brand-primary")} />
                                  {cat.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}

              {formData.type === "PRODUCT" && (
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SKU Targeting</Label>
                  <Popover open={openProductCombobox} onOpenChange={setOpenProductCombobox}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-12 justify-between rounded-xl bg-slate-50 border-none font-bold text-xs">
                        {formData.products.length > 0 ? `${formData.products.length} Products Locked` : "Scan or Select Products..."}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0 rounded-2xl border-brand-primary/5 shadow-2xl">
                      <Command shouldFilter={false}>
                        <CommandInput placeholder="Search catalog..." value={productSearch} onValueChange={setProductSearch} />
                        <CommandList>
                          <CommandEmpty>{isFetchingProducts ? "Searching..." : "No items found"}</CommandEmpty>
                          <CommandGroup>
                            {displayProducts.map((product) => (
                              <CommandItem
                                key={product.id}
                                onSelect={() => {
                                  const current = [...formData.products];
                                  const idx = current.indexOf(product.id.toString());
                                  if (idx > -1) {
                                    current.splice(idx, 1);
                                    setSelectedProductsDetails(prev => prev.filter(p => p.id !== product.id));
                                  } else {
                                    current.push(product.id.toString());
                                    setSelectedProductsDetails(prev => [...prev, product]);
                                  }
                                  setFormData({ ...formData, products: current });
                                }}
                                className="p-2"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className={cn("h-4 w-4 border rounded", formData.products.includes(product.id.toString()) && "bg-brand-primary border-brand-primary")} />
                                  <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-100">
                                    <img src={getProductImage(product)} alt="" className="h-full w-full object-cover" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black">{product.name}</span>
                                    <span className="text-[10px] font-bold text-slate-400">SKU: {product.sku}</span>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          {hasMoreProducts && <div ref={observerTarget} className="p-4 flex justify-center"><RefreshCw className="h-4 w-4 animate-spin text-slate-300" /></div>}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Launch Date</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expiration Date</Label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strategic Overview</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the objective of this promotional cycle..."
                className="rounded-xl bg-slate-50 border-none font-medium min-h-[100px]"
              />
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => { setIsCreating(false); setEditingId(null); resetForm(); }} className="h-12 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400">Discard</Button>
              <Button onClick={editingId ? handleUpdateDiscount : handleCreateDiscount} className="h-12 px-8 bg-brand-primary text-brand-secondary rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20">
                <Save className="w-3.5 h-3.5 mr-2" />
                {editingId ? "Update Strategy" : "Deploy Strategy"}
              </Button>
            </div>
          </DataPanel>
        </motion.div>
      )}

      <motion.div variants={item}>
        <DataPanel title="Discount campaigns" description={`Active and past discounts (${discounts.length}).`}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scope</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Magnitude</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Lifecycle</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">No active campaigns</TableCell></TableRow>
                ) : (
                  discounts.map((discount: Discount) => (
                    <TableRow key={discount.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell><span className="text-xs font-black text-brand-primary">{discount.name}</span></TableCell>
                      <TableCell>{getTypeBadge(discount.discount_type)}</TableCell>
                      <TableCell><span className="text-[10px] font-bold text-slate-500 max-w-[200px] block truncate">{getTargetName(discount)}</span></TableCell>
                      <TableCell><span className="text-xs font-black text-brand-primary">{discount.value}%</span></TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(discount.status)}
                          <span className="text-[9px] font-bold text-slate-400">{new Date(discount.start_date).toLocaleDateString()} - {new Date(discount.end_date).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditDiscount(discount.id)} className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-white"><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteDiscount(discount.id)} className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-white"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DataPanel>
      </motion.div>
    </motion.div>
  );
}
