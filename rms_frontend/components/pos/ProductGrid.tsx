"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Barcode,
  CheckCircle2,
  Minus,
  Package2,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { GridSkeleton } from "@/components/ui/professional";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInfiniteProducts } from "@/hooks/queries/useInventory";
import { formatCurrency, cn, getImageUrl } from "@/lib/utils";
import { usePOSStore } from "@/store/pos-store";
import { Product } from "@/types/inventory";

interface ProductGridProps {
  searchQuery?: string;
  selectedCategory?: string;
  priceRange?: [number, number];
}

type VariantQuantityMap = Record<string, number>;

export default function ProductGrid({
  searchQuery = "",
  selectedCategory = "all",
}: ProductGridProps) {
  const { handleAddMultipleToCart } = usePOSStore();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [variantQuantities, setVariantQuantities] = useState<VariantQuantityMap>({});

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteProducts({
    search: debouncedSearch,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const products = data?.pages.flatMap((page) => page.results) || [];

  useEffect(() => {
    if (!activeProduct) {
      setVariantQuantities({});
      return;
    }

    const defaults: VariantQuantityMap = {};
    for (const design of activeProduct.designs || []) {
      for (const color of design.colors) {
        defaults[getVariantKey(design.name, color.color)] = 0;
      }
    }
    setVariantQuantities(defaults);
  }, [activeProduct]);

  const selectedVariants = useMemo(() => {
    if (!activeProduct) {
      return [];
    }

    return (activeProduct.designs || []).flatMap((design) =>
      design.colors
        .filter((color) => (variantQuantities[getVariantKey(design.name, color.color)] || 0) > 0)
        .map((color) => ({
          design: design.name,
          color: color.color,
          colorHex: color.color_hax,
          stock: color.stock,
          quantity: variantQuantities[getVariantKey(design.name, color.color)] || 0,
        }))
    );
  }, [activeProduct, variantQuantities]);

  const selectedTotalQuantity = selectedVariants.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (
    designName: string,
    colorName: string,
    stock: number,
    rawValue: string
  ) => {
    const parsed = Number.parseInt(rawValue || "0", 10);
    const safeValue = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, stock));

    setVariantQuantities((prev) => ({
      ...prev,
      [getVariantKey(designName, colorName)]: safeValue,
    }));
  };

  const handleCommitSelection = () => {
    if (!activeProduct || selectedVariants.length === 0) {
      return;
    }

    handleAddMultipleToCart(
      selectedVariants.map((variant) => ({
        product: activeProduct,
        design: variant.design,
        color: variant.color,
        quantity: variant.quantity,
      }))
    );

    setActiveProduct(null);
  };

  if (isLoading) {
    return <GridSkeleton count={6} />;
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h3 className="text-lg font-medium">Error loading products</h3>
        <p className="text-muted-foreground">Please try again later</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3">
          {products.map((product) => {
            const totalStock = (product.designs || []).reduce(
              (sum, design) => sum + design.colors.reduce((inner, color) => inner + color.stock, 0),
              0
            );
            const cutoff = product.resolved_wholesale_cutoff || product.wholesale_cutoff || 10;
            const isLowStock = totalStock > 0 && totalStock < 5;

            const variantCount = (product.designs || []).reduce(
              (sum, design) => sum + design.colors.length,
              0
            );
            const productImage = getPosProductImage(product);

            return (
              <Card
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="relative h-24 overflow-hidden bg-slate-100">
                  <img
                    src={productImage}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />

                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
                    <Badge className="rounded-full bg-white/95 text-[8px] font-black text-slate-600 shadow-sm px-1.5 py-0">
                      {product.sku}
                    </Badge>
                    {isLowStock ? (
                      <Badge variant="destructive" className="rounded-full text-[8px] px-1.5 py-0">
                        Low
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <CardContent className="p-2.5 space-y-2">
                  <div className="space-y-0.5">
                    <h3 className="line-clamp-1 text-[11px] font-black text-slate-900 uppercase" title={product.name}>
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                      <span>{totalStock} STOCK</span>
                      <span>{variantCount} VARIANTS</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-1.5">
                      <div className="text-[7px] font-black uppercase text-emerald-600">Retail</div>
                      <div className="text-[11px] font-black text-slate-900">
                        {formatCurrency(Number(product.retail_price || 0))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-1.5">
                      <div className="text-[7px] font-black uppercase text-blue-600">Wholesale</div>
                      <div className="text-[11px] font-black text-slate-900">
                        {formatCurrency(Number(product.wholesale_price || 0))}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setActiveProduct(product)}
                    className="h-8 w-full rounded-xl bg-slate-900 text-[9px] font-black uppercase tracking-widest text-white hover:bg-slate-800"
                  >
                    Configure
                    <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          {products.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-10 text-center">
              <ShoppingBag className="mb-2 h-8 w-8 text-gray-300" />
              <h3 className="text-sm font-medium">No products found</h3>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : null}
        </div>

        {hasNextPage ? (
          <div ref={observerTarget} className="flex w-full justify-center py-8">
            {isFetchingNextPage ? (
              <div className="w-full">
                <GridSkeleton count={4} />
              </div>
            ) : (
              <Button
                variant="ghost"
                className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-brand-primary"
              >
                Load more items
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <Dialog open={Boolean(activeProduct)} onOpenChange={(open) => !open && setActiveProduct(null)}>
        <DialogContent className="max-h-[94vh] w-[min(1180px,calc(100vw-24px))] overflow-hidden border-none bg-white p-0 shadow-2xl sm:max-w-none">
          {activeProduct ? (
            <div className="flex h-[94vh] flex-col">
              {/* Premium Header */}
              <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-8 py-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-lg shadow-slate-200">
                        <Package2 className="h-5 w-5 text-emerald-400" />
                      </div>
                      <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
                        {activeProduct.name}
                      </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Product Configuration & Selection
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Selection</div>
                      <div className="text-xl font-black text-slate-900">{selectedTotalQuantity} Units</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[minmax(0,1fr)_minmax(340px,360px)]">
                {/* Left Side: Variant Selection List */}
                <div className="flex min-h-0 flex-col overflow-hidden bg-white">
                  <div className="border-b border-slate-50 px-6 py-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_72px_96px_112px] items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Variant Details</span>
                      <span className="text-center">Stock</span>
                      <span className="text-right">Price</span>
                      <span className="text-center">Order Qty</span>
                    </div>
                  </div>
                  
                  <ScrollArea className="flex-1">
                    <div className="space-y-5 p-6">
                      {(activeProduct.designs || []).map((design) => (
                        <div key={design.id} className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
                              {design.name}
                            </h4>
                            <div className="h-[1px] flex-1 bg-slate-100" />
                            <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                              {design.colors.length} options
                            </Badge>
                          </div>

                          <div className="grid gap-2">
                            {design.colors.map((color) => {
                              const key = getVariantKey(design.name, color.color);
                              const quantity = variantQuantities[key] || 0;
                              const cutoff = activeProduct.resolved_wholesale_cutoff || activeProduct.wholesale_cutoff || 10;
                              const useWholesale = quantity >= cutoff && Number(activeProduct.wholesale_price || 0) > 0;
                              const unitPrice = useWholesale
                                ? Number(activeProduct.wholesale_price || 0)
                                : Number(activeProduct.retail_price || 0);

                              return (
                                <div
                                  key={key}
                                  className={cn(
                                    "grid grid-cols-[minmax(0,1fr)_72px_96px_112px] items-center gap-3 rounded-2xl border p-3 transition-all duration-200",
                                    quantity > 0 
                                      ? "border-emerald-200 bg-emerald-50/30 ring-1 ring-emerald-100/50" 
                                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50"
                                  )}
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div 
                                      className="h-8 w-8 shrink-0 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200" 
                                      style={{ backgroundColor: color.color_hax || "#cbd5e1" }}
                                    />
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-bold text-slate-900">{color.color}</div>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        {useWholesale ? (
                                          <Badge className="bg-emerald-500 text-[8px] font-black text-white hover:bg-emerald-500 px-1 py-0 h-3.5">WHOLESALE</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-[8px] font-black text-slate-400 px-1 py-0 h-3.5">RETAIL</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-center">
                                    <div className={cn(
                                      "text-xs font-black",
                                      color.stock < 5 ? "text-red-500" : "text-slate-600"
                                    )}>
                                      {color.stock}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-sm font-black text-slate-900">
                                      {formatCurrency(unitPrice)}
                                    </div>
                                  </div>

                                  <div className="flex justify-center">
                                    <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-900"
                                        onClick={() => handleQuantityChange(design.name, color.color, color.stock, String(Math.max(0, quantity - 1)))}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <Input
                                        type="number"
                                        className="h-7 w-12 border-none bg-transparent p-0 text-center text-xs font-black focus-visible:ring-0"
                                        value={quantity || ""}
                                        onChange={(e) => handleQuantityChange(design.name, color.color, color.stock, e.target.value)}
                                        placeholder="0"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-900"
                                        onClick={() => handleQuantityChange(design.name, color.color, color.stock, String(Math.min(color.stock, quantity + 1)))}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right Side: Summary & Actions */}
                <div className="flex min-h-0 flex-col overflow-hidden border-l border-slate-100 bg-slate-50/70 p-5">
                  <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
                    {/* Product Preview Card */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="aspect-[16/9] max-h-40 overflow-hidden bg-slate-100">
                        <img
                          src={getPosProductImage(activeProduct)}
                          alt={activeProduct.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="space-y-4 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <Badge variant="outline" className="min-w-0 rounded-full px-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                            Current Price Info
                          </Badge>
                          <div className="shrink-0 text-[9px] font-black uppercase text-emerald-600">Active</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Retail Price</div>
                            <div className="truncate text-base font-black text-slate-900">{formatCurrency(Number(activeProduct.retail_price))}</div>
                          </div>
                          <div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Wholesale</div>
                            <div className="truncate text-base font-black text-slate-900">{formatCurrency(Number(activeProduct.wholesale_price))}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Selection Summary */}
                    <div className="flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden">
                      <h4 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Selected Variants</h4>
                      <ScrollArea className="-mx-1 min-h-0 flex-1 px-1">
                        <div className="space-y-2">
                          {selectedVariants.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-50">
                                <Plus className="h-5 w-5 text-slate-300" />
                              </div>
                              <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">No selection yet</p>
                            </div>
                          ) : (
                            selectedVariants.map((variant) => (
                              <div key={`${variant.design}-${variant.color}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white ring-offset-1" style={{ backgroundColor: variant.colorHex || "#cbd5e1" }} />
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-bold text-slate-900">{variant.design} - {variant.color}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-normal text-slate-400">Qty: {variant.quantity} units</div>
                                  </div>
                                </div>
                                <div className="shrink-0 whitespace-nowrap text-right text-xs font-black text-slate-900">
                                  {formatCurrency((variant.quantity >= (activeProduct.resolved_wholesale_cutoff || 10) ? Number(activeProduct.wholesale_price) : Number(activeProduct.retail_price)) * variant.quantity)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between gap-4 px-1">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Estimated Total</span>
                      <span className="shrink-0 text-xl font-black text-slate-900">
                        {formatCurrency(selectedVariants.reduce((sum, v) => {
                          const unitPrice = v.quantity >= (activeProduct.resolved_wholesale_cutoff || 10) ? Number(activeProduct.wholesale_price) : Number(activeProduct.retail_price);
                          return sum + (unitPrice * v.quantity);
                        }, 0))}
                      </span>
                    </div>
                    <Button
                      onClick={handleCommitSelection}
                      disabled={selectedVariants.length === 0}
                      className="h-12 w-full rounded-2xl bg-slate-900 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 disabled:opacity-50"
                    >
                      Add to Cart
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setActiveProduct(null)}
                      className="w-full text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
                    >
                      Cancel Selection
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function getVariantKey(design: string, color: string) {
  return `${design}__${color}`;
}
function getPosProductImage(product: Product) {
  const galleryImage = product.galleries
    ?.flatMap((gallery) => gallery.images || [])
    .find((image) => image.imageType === "PRIMARY");

  return getImageUrl(
    galleryImage?.image_url ||
      galleryImage?.image ||
      product.first_variation_image ||
      product.image_url ||
      product.image
  );
}
function useDebounce<T>(value: T, delay: number): [T] {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue];
}
