"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Barcode,
  CheckCircle2,
  Package2,
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
import { formatCurrency } from "@/lib/utils";
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
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const totalStock = (product.designs || []).reduce(
              (sum, design) => sum + design.colors.reduce((inner, color) => inner + color.stock, 0),
              0
            );
            const variantCount = (product.designs || []).reduce(
              (sum, design) => sum + design.colors.length,
              0
            );
            const cutoff = product.resolved_wholesale_cutoff || product.wholesale_cutoff || 10;
            const isLowStock = totalStock > 0 && totalStock < 5;

            return (
              <Card
                key={product.id}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-36 overflow-hidden bg-slate-100">
                  <img
                    src={product.image || "/placeholder.svg?height=240&width=320"}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />

                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                    <Badge className="rounded-full bg-white/95 text-[10px] font-bold text-slate-600 shadow-sm">
                      <Barcode className="mr-1 h-3 w-3" />
                      {product.sku}
                    </Badge>
                    {isLowStock ? (
                      <Badge variant="destructive" className="rounded-full text-[10px]">
                        Low Stock
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <CardContent className="space-y-4 p-4">
                  <div className="space-y-1.5">
                    <h3 className="line-clamp-1 text-sm font-black text-slate-900" title={product.name}>
                      {product.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      <span>{variantCount} variants</span>
                      <span>{totalStock} stock</span>
                      <span>{cutoff}+ wholesale</span>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                      Wholesale
                    </div>
                    <div className="mt-1 text-2xl font-black text-slate-900">
                      {formatCurrency(Number(product.wholesale_price || 0))}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Retail {formatCurrency(Number(product.retail_price || 0))}
                    </div>
                  </div>

                  <Button
                    onClick={() => setActiveProduct(product)}
                    className="h-11 w-full rounded-2xl bg-slate-900 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-slate-800"
                  >
                    Configure Product
                    <ArrowRight className="ml-2 h-4 w-4" />
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
        <DialogContent className="max-h-[88vh] overflow-hidden border-none bg-white p-0 shadow-2xl sm:max-w-5xl">
          {activeProduct ? (
            <>
              <DialogHeader className="border-b border-slate-100 px-6 py-5">
                <DialogTitle className="flex items-center gap-3 text-2xl font-black text-slate-900">
                  <Package2 className="h-6 w-6 text-emerald-600" />
                  {activeProduct.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Choose design, color, and typed quantity. Selections for this product merge into one grouped cart card.
                </DialogDescription>
              </DialogHeader>

              <div className="grid max-h-[calc(88vh-92px)] grid-cols-1 md:grid-cols-[1.6fr_0.95fr]">
                <ScrollArea className="max-h-[calc(88vh-92px)] px-6 py-5">
                  <div className="mb-3 grid grid-cols-[minmax(0,1.5fr)_90px_92px_92px] items-center gap-3 px-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    <span>Variant</span>
                    <span className="text-right">Stock</span>
                    <span className="text-right">Price</span>
                    <span className="text-right">Qty</span>
                  </div>

                  <div className="space-y-4">
                    {(activeProduct.designs || []).map((design) => (
                      <section
                        key={design.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                              {design.name}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Enter quantities by color. Zero means not selected.
                            </p>
                          </div>

                          <Badge
                            variant="outline"
                            className="rounded-full border-slate-300 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-500"
                          >
                            {design.colors.length} colors
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {design.colors.map((color) => {
                            const key = getVariantKey(design.name, color.color);
                            const quantity = variantQuantities[key] || 0;
                            const cutoff =
                              activeProduct.resolved_wholesale_cutoff ||
                              activeProduct.wholesale_cutoff ||
                              10;
                            const useWholesale =
                              quantity >= cutoff && Number(activeProduct.wholesale_price || 0) > 0;
                            const unitPrice = useWholesale
                              ? Number(activeProduct.wholesale_price || 0)
                              : Number(activeProduct.retail_price || 0);

                            return (
                              <div
                                key={key}
                                className={`grid grid-cols-[minmax(0,1.5fr)_90px_92px_92px] items-center gap-3 rounded-2xl border px-3 py-3 ${
                                  quantity > 0
                                    ? "border-emerald-200 bg-white shadow-sm"
                                    : "border-slate-200 bg-white/80"
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-4 w-4 rounded-full border border-slate-300"
                                      style={{ backgroundColor: color.color_hax || "#cbd5e1" }}
                                    />
                                    <span className="truncate text-sm font-semibold text-slate-800">
                                      {color.color}
                                    </span>
                                    {quantity > 0 ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    ) : null}
                                  </div>
                                  <div className="mt-1">
                                    <Badge
                                      className={
                                        useWholesale
                                          ? "rounded-full bg-emerald-100 text-[10px] font-black uppercase tracking-widest text-emerald-700"
                                          : "rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600"
                                      }
                                    >
                                      {useWholesale ? "Wholesale" : "Retail"}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="text-right text-sm font-semibold text-slate-700">
                                  {color.stock}
                                </div>

                                <div className="text-right">
                                  <div className="text-sm font-black text-slate-900">
                                    {formatCurrency(unitPrice)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    RT {formatCurrency(Number(activeProduct.retail_price || 0))}
                                  </div>
                                </div>

                                <Input
                                  type="number"
                                  min={0}
                                  max={color.stock}
                                  value={quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(design.name, color.color, color.stock, e.target.value)
                                  }
                                  className="h-10 rounded-xl border-slate-200 text-center text-sm font-black"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </ScrollArea>

                <div className="border-l border-slate-100 bg-slate-950 px-5 py-5 text-white">
                  <div className="space-y-5">
                    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                      <div className="h-40 overflow-hidden border-b border-slate-800 bg-slate-800/60">
                        <img
                          src={activeProduct.image || "/placeholder.svg?height=320&width=480"}
                          alt={activeProduct.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="space-y-2 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                          Pricing
                        </div>
                        <div className="text-2xl font-black">
                          {formatCurrency(Number(activeProduct.wholesale_price || 0))}
                        </div>
                        <div className="text-sm text-slate-400">
                          Retail {formatCurrency(Number(activeProduct.retail_price || 0))}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Wholesale starts at{" "}
                          {activeProduct.resolved_wholesale_cutoff ||
                            activeProduct.wholesale_cutoff ||
                            10}
                          + units per selected color row.
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Selected rows</span>
                        <span className="font-black">{selectedVariants.length}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-slate-400">Total quantity</span>
                        <span className="font-black">{selectedTotalQuantity}</span>
                      </div>

                      <div className="mt-4 space-y-2">
                        {selectedVariants.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-700 px-3 py-4 text-center text-xs text-slate-500">
                            Type quantities to prepare this product for the cart.
                          </div>
                        ) : (
                          selectedVariants.map((variant) => {
                            const cutoff =
                              activeProduct.resolved_wholesale_cutoff ||
                              activeProduct.wholesale_cutoff ||
                              10;
                            const useWholesale =
                              variant.quantity >= cutoff &&
                              Number(activeProduct.wholesale_price || 0) > 0;
                            const unitPrice = useWholesale
                              ? Number(activeProduct.wholesale_price || 0)
                              : Number(activeProduct.retail_price || 0);

                            return (
                              <div
                                key={`${variant.design}-${variant.color}`}
                                className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-black uppercase tracking-wide">
                                      {variant.design}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                                      <span
                                        className="h-3 w-3 rounded-full border border-slate-700"
                                        style={{
                                          backgroundColor:
                                            variant.colorHex && variant.colorHex !== "null"
                                              ? variant.colorHex
                                              : "#94a3b8",
                                        }}
                                      />
                                      <span className="truncate">
                                        {variant.color} x {variant.quantity}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge
                                    className={
                                      useWholesale
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-slate-100 text-slate-700"
                                    }
                                  >
                                    {useWholesale ? "WS" : "RT"}
                                  </Badge>
                                </div>
                                <div className="mt-2 text-right text-sm font-black">
                                  {formatCurrency(unitPrice * variant.quantity)}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleCommitSelection}
                      disabled={selectedVariants.length === 0}
                      className="h-12 w-full rounded-2xl bg-emerald-500 text-xs font-black uppercase tracking-[0.2em] text-slate-950 hover:bg-emerald-400"
                    >
                      Add Selected Variants
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function getVariantKey(design: string, color: string) {
  return `${design}__${color}`;
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
