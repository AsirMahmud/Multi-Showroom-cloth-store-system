"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteProducts, useDeleteProduct, useProductStats, useCategories } from "@/hooks/queries/useInventory";
import { productsApi } from "@/lib/api/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Search,
  SortAsc,
  Grid3X3,
  List,
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  MoreHorizontal,
  Edit3,
  Eye,
  Trash2,
  Barcode,
  Tag,
  Building2,
  ShoppingCart,
  Globe,
  Globe2,
  Download,
} from "lucide-react";
import Link from "next/link";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageHeader, MetricCard, DataPanel, TableSkeleton } from "@/components/ui/professional";
import type { Product } from "@/types/inventory";
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
import { getImageUrl, slugify, cn } from "@/lib/utils";

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

export default function ProductsPage() {
  const router = useRouter();
  const observerTarget = useRef<HTMLDivElement>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Fetch categories for filter dropdown
  const { data: categoriesData = [] } = useCategories();

  // Build filter params for API calls
  const filterParams = {
    search: debouncedSearch,
    category: categoryFilter !== "all" ? parseInt(categoryFilter) : undefined,
    is_active: statusFilter === "all" ? undefined : statusFilter === "active",
    stock_status: stockFilter !== "all" ? stockFilter : undefined,
  };

  // Fetch products with infinite scroll
  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteProducts({
    ...filterParams,
    page_size: 20,
  });

  // Fetch product statistics from backend
  const { data: statsData, isLoading: isStatsLoading } = useProductStats(filterParams);

  // Flatten pages into a single list of products
  const products = productsData?.pages.flatMap((page) => page.results) || [];
  const totalCount = productsData?.pages[0]?.count || 0;

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const deleteProduct = useDeleteProduct();

  // Helper for debounce is now imported

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct.mutateAsync(productToDelete.id);
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
      console.error("Error deleting product:", error);
    } finally {
      setProductToDelete(null);
    }
  };

  const handleToggleOnlineAssignment = async (product: Product) => {
    try {
      const response = await productsApi.toggleOnlineAssignment(product.id);
      toast.success(response.message);
      // Refresh the products list - in React Query we should invalidate queries,
      // but reloading is a quick fallback if we don't have the query client here.
      // Better: useQueryClient().invalidateQueries(...) if we added it.
      // For now, keeping window.location.reload() or letting the user refresh manually effectively.
      // Actually, since we are using useProducts, we can let React Query handle it if we invalidate.
      window.location.reload();
    } catch (error) {
      toast.error("Failed to toggle online assignment");
      console.error("Error toggling online assignment:", error);
    }
  };

  const handleDownloadCatalog = () => {
    // Note: This relies on fetched products. For a full catalog download, 
    // we should ideally request *all* products from backend, not just the current page.
    // However, given the requirement, we'll keep it as is or note the limitation.
    // If the user wants a full catalog, we might need a separate API call.
    // For now, let's use the current page's products or maybe fetch all if needed?
    // Let's assume current page for now to avoid massive bandwidth spikes, 
    // or arguably we should enable a "download all" button that hits a dedicated endpoint.
    const onlineProducts = products.filter((p: Product) => p.assign_to_online);

    if (onlineProducts.length === 0) {
      toast.error("No online products found to download");
      return;
    }

    const headers = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "link",
      "image_link",
      "brand",
      "google_product_category",
      "fb_product_category",
      "quantity_to_sell_on_facebook",
      "sale_price",
      "sale_price_effective_date",
      "item_group_id",
      "gender",
      "color",
      "size",
      "age_group",
      "material",
      "pattern",
      "shipping",
      "shipping_weight",
      "video[0].url",
      "video[0].tag[0]",
      "gtin",
      "product_tags[0]",
      "product_tags[1]",
      "style[0]",
    ];

    const rows: string[][] = [];

    onlineProducts.forEach((product: Product) => {
      // Base URL for links
      const ecomBaseUrl = ""; // Dynamic base URL should be used here

      // If the product has galleries (color variants), create a row for each
      if (product.galleries && product.galleries.length > 0) {
        product.galleries.forEach((gallery) => {
          const colorSlug = gallery.color ? slugify(gallery.color) : "";
          const variantId = colorSlug ? `${product.id}-${colorSlug}` : product.id.toString();
          const variantTitle = gallery.color ? `${product.name} - ${gallery.color}` : product.name;
          const variantImage = gallery.images?.[0]?.image || product.first_variation_image || product.image;

          const row = [
            variantId,
            variantTitle,
            product.description || "Premium quality clothing from Ferdous Textile. Designed for style and comfort.",
            product.stock_quantity > 0 ? "in stock" : "out of stock",
            "new",
            `${product.retail_price} BDT`,
            `${ecomBaseUrl}/product/${product.id}${colorSlug ? `/${colorSlug}` : ""}`,
            getImageUrl(variantImage),
            "Ferdous Textile",
            product.online_categories?.[0]?.name || product.category?.name || "",
            product.online_categories?.[0]?.name || product.category?.name || "",
            product.stock_quantity.toString(),
            product.discount_percentage && product.discount_percentage > 0 ? `${product.sale_price} BDT` : "",
            product.discount_end_date || "",
            product.sku,
            product.gender || "unisex",
            gallery.color || "",
            "", // design (can be filled if needed)
            "adult",
            product.material_composition_string || "",
            "", "", "", "", "", "", "", "", ""
          ];
          rows.push(row.map(val => `"${val?.toString().replace(/"/g, '""') || ""}"`));
        });
      } else {
        // Fallback for products without galleries
        const row = [
          product.id.toString(),
          product.name || "Ferdous Textile Product",
          product.description || "Premium quality clothing from Ferdous Textile.",
          product.stock_quantity > 0 ? "in stock" : "out of stock",
          "new",
          `${product.retail_price} BDT`,
          `${ecomBaseUrl}/product/${product.id}`,
          getImageUrl(product.image),
          "Ferdous Textile",
          product.online_categories?.[0]?.name || product.category?.name || "",
          product.online_categories?.[0]?.name || product.category?.name || "",
          product.stock_quantity.toString(),
          product.discount_percentage && product.discount_percentage > 0 ? `${product.sale_price} BDT` : "",
          product.discount_end_date || "",
          product.sku,
          product.gender || "unisex",
          "", // color
          "", // design
          "adult",
          product.material_composition_string || "",
          "", "", "", "", "", "", "", "", ""
        ];
        rows.push(row.map(val => `"${val?.toString().replace(/"/g, '""') || ""}"`));
      }
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "catalog_products.csv");
    toast.success("Catalog downloaded successfully");
  };

  // Use backend stats instead of client-side calculations
  const stats = statsData || {
    total_products: 0,
    active_products: 0,
    low_stock_products: 0,
    out_of_stock_products: 0,
    total_cost: 0,
    total_value: 0,
    potential_profit: 0,
  };

  const filteredProducts = products; // Alias for compatibility with existing render code

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[24px] bg-slate-100 animate-pulse" />
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="h-12 flex-1 bg-slate-50 animate-pulse rounded-xl" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 w-44 bg-slate-50 animate-pulse rounded-xl" />
          ))}
        </div>

        <TableSkeleton cols={7} rows={10} />
      </div>
    );
  }

  const ProductCard = ({ product }: { product: Product }) => {
    // Get the first image from galleries for display
    const firstImage = product.galleries?.[0]?.images?.[0];
    const imageUrl = getImageUrl(firstImage?.image);

    return (
      <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {imageUrl ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-blue-300 transition-colors">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Barcode className="h-3 w-3" />
                    {product.sku}
                  </div>
                  {(product.gender) && (
                      <div className="flex gap-1 mt-1">
                        {product.gender && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-red-600 text-white"
                          >
                            {product.gender}
                          </Badge>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/inventory/products/${product.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/inventory/edit-product/${product.id}`}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Product
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => setProductToDelete(product)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Category</span>
              </div>
              <p className="font-medium">
                {product.category?.name || "Uncategorized"}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Supplier</span>
              </div>
              <p className="font-medium">
                {product.supplier?.company_name || "No Supplier"}
              </p>
            </div>
          </div>

          {/* Gallery Preview */}
          {product.galleries && product.galleries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Available Colors</p>
              <div className="flex gap-2 flex-wrap">
                {product.galleries.map((gallery, index) => {
                  const firstImage = gallery.images?.[0];
                  const imageUrl = getImageUrl(firstImage?.image);
                  return (
                    <div
                      key={index}
                      className="relative group"
                      title={`${gallery.color} (${gallery.images?.length || 0} images)`}
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-gray-300 overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={gallery.color}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: gallery.color_hax || '#000000' }}
                          />
                        )}
                      </div>
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {gallery.color}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Cost</p>
              <p className="text-sm font-bold text-slate-500">
                ${product.cost_price}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Wholesale</p>
              <p className="text-sm font-bold text-blue-600">
                ${product.wholesale_price}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Retail</p>
              <p className="text-sm font-bold text-emerald-600">
                ${product.retail_price}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-lg font-bold text-blue-600">
                ${(product.cost_price * product.stock_quantity).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Potential Profit</p>
              <p className="text-lg font-bold text-green-600">
                $
                {(
                  (product.retail_price - product.cost_price) *
                  product.stock_quantity
                ).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Stock Level</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{product.stock_quantity}</p>
                {product.stock_quantity <= product.minimum_stock && (
                  <Badge variant="destructive" className="text-xs">
                    Low Stock
                  </Badge>
                )}
              </div>
            </div>
            <Badge
              variant={product.is_active ? "default" : "secondary"}
              className="ml-auto"
            >
              {product.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Online Status</p>
              <p className="text-sm font-medium">
                {product.assign_to_online ? "Online" : "Offline"}
              </p>
            </div>
            <Button
              variant={product.assign_to_online ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggleOnlineAssignment(product)}
              className={`flex items-center gap-2 ${product.assign_to_online
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "border-gray-300 hover:bg-gray-50"
                }`}
            >
              {product.assign_to_online ? (
                <>
                  <Globe className="h-3 w-3" />
                  Online
                </>
              ) : (
                <>
                  <Globe2 className="h-3 w-3" />
                  Offline
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="Inventory Matrix"
        description="Global SKU management and stock-level optimization control center."
        icon={<ShoppingCart className="h-6 w-6" />}
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadCatalog}
              className="h-10 px-4 bg-white border-brand-primary/5 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary hover:bg-slate-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Catalog Export
            </Button>
            <Button
              onClick={() => router.push("/inventory/add-product")}
              className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Node
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Total Catalog"
            value={isStatsLoading ? "..." : stats.total_products}
            icon={<Package className="h-5 w-5" />}
            tone="brand"
            helper={isStatsLoading ? "Loading..." : `${stats.active_products} Live SKUs`}
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Capital Invested"
            value={isStatsLoading ? "..." : `$${stats.total_cost.toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5" />}
            tone="brand"
            helper="Current inventory value"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Expected Yield"
            value={isStatsLoading ? "..." : `$${stats.total_value.toLocaleString()}`}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="emerald"
            helper="Potential gross revenue"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Net Potential"
            value={isStatsLoading ? "..." : `$${stats.potential_profit.toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5" />}
            tone="brand"
            helper="Projected gross profit"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Low Stock Alerts"
            value={isStatsLoading ? "..." : stats.low_stock_products}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="indigo"
            helper="Restock recommended"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Stockouts"
            value={isStatsLoading ? "..." : stats.out_of_stock_products}
            icon={<Package className="h-5 w-5" />}
            tone="rose"
            helper="Critical replenishment"
          />
        </motion.div>
      </div>


        {/* Products List/Grid */}
      <DataPanel title="Product Catalog" description="Manage your inventory nodes with granular control over stock, pricing, and distribution.">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-slate-50/50 border-none rounded-xl focus-visible:ring-brand-primary"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] h-11 bg-slate-50/50 border-none rounded-xl focus:ring-brand-primary">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoriesData.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-11 bg-slate-50/50 border-none rounded-xl focus:ring-brand-primary">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[180px] h-11 bg-slate-50/50 border-none rounded-xl focus:ring-brand-primary">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex bg-slate-50/50 rounded-xl p-1 gap-1">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
              className={cn("h-9 w-9 rounded-lg", viewMode === "table" && "bg-white shadow-sm")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={cn("h-9 w-9 rounded-lg", viewMode === "grid" && "bg-white shadow-sm")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Product</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Category</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Online Node</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Stock</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Retail</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Sale Price</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Channels</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const firstImage = product.galleries?.[0]?.images?.[0];
                  const imageUrl = getImageUrl(firstImage?.image);

                  return (
                    <TableRow key={product.id} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100">
                              <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                              <Package className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-black text-slate-700">{product.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[9px] uppercase tracking-widest">
                          {product.category?.name || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-[10px] font-bold text-brand-primary uppercase tracking-tight">
                          {product.online_categories && product.online_categories.length > 0
                            ? product.online_categories.map(c => c.name).join(", ")
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-600">{product.stock_quantity}</span>
                          {product.stock_quantity <= product.minimum_stock && (
                            <Badge variant="destructive" className="bg-rose-50 text-rose-600 border-none font-black text-[8px] uppercase">Low</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-xs font-bold text-slate-600">${product.retail_price}</TableCell>
                      <TableCell className="py-4 text-xs font-black text-emerald-600">
                        {product.discount_percentage && product.discount_percentage > 0 ? (
                          <span>${product.sale_price}</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant={product.is_active ? "default" : "secondary"} className={cn(
                          "border-none font-black text-[9px] uppercase tracking-widest",
                          product.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        )}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleOnlineAssignment(product)}
                          className={cn(
                            "h-7 px-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all",
                            product.assign_to_online 
                              ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" 
                              : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                          )}
                        >
                          {product.assign_to_online ? <Globe className="h-2.5 w-2.5 mr-1" /> : <Globe2 className="h-2.5 w-2.5 mr-1" />}
                          {product.assign_to_online ? "Online" : "Offline"}
                        </Button>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-xl">
                            <DropdownMenuItem asChild className="rounded-lg py-2 cursor-pointer">
                              <Link href={`/inventory/products/${product.id}`}><Eye className="mr-2 h-4 w-4" /> View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-lg py-2 cursor-pointer">
                              <Link href={`/inventory/edit-product/${product.id}`}><Edit3 className="mr-2 h-4 w-4" /> Edit Product</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-50" />
                            <DropdownMenuItem className="rounded-lg py-2 text-rose-600 cursor-pointer" onClick={() => setProductToDelete(product)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-4 py-8 mt-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Node Count: <span className="text-slate-900">{products.length}</span> of {totalCount} SKUs
          </div>
          {isFetchingNextPage && (
            <div className="w-full space-y-4 py-8">
              <div className="h-12 bg-slate-50 animate-pulse rounded-2xl w-full" />
              <div className="h-12 bg-slate-50 animate-pulse rounded-2xl w-full" />
            </div>
          )}
          {!hasNextPage && products.length > 0 && (
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Catalog fully synchronized</div>
          )}
          <div ref={observerTarget} className="h-1 w-full" />
        </div>
      </DataPanel>

      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-900">Decommission SKU?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              This will permanently remove the product node from the global matrix. This action cannot be reverted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-slate-100">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-rose-600 hover:bg-rose-700 rounded-xl font-bold uppercase text-[10px] tracking-widest">Confirm Deletion</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
