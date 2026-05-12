"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShoppingBag, Plus, Barcode, Percent } from "lucide-react";
import { useInfiniteProducts } from "@/hooks/queries/useInventory";
import { Product } from "@/types/inventory";
import { Discount } from "@/lib/api/ecommerce";
import { useDebounce } from "@/hooks/use-debounce";
import { GridSkeleton } from "@/components/ui/professional";

interface POSStyleProductGridProps {
    searchQuery?: string;
    discounts?: Discount[];
    onSelectItem: (item: {
        product: Product;
        design: string;
        color: string;
        colorHex?: string;
        finalPrice: number;
        discountAmount: number;
    }) => void;
}

export default function POSStyleProductGrid({
    searchQuery = "",
    discounts = [],
    onSelectItem,
}: POSStyleProductGridProps) {
    const [selectedDesigns, setSelectedDesigns] = useState<Record<number, string>>({});
    const [selectedColors, setSelectedColors] = useState<Record<number, string>>({});
    const observerTarget = useRef<HTMLDivElement>(null);

    const debouncedSearch = useDebounce(searchQuery, 500);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteProducts({
        search: debouncedSearch,
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

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const products = data?.pages.flatMap((page) => page.results) || [];

    const getUniqueDesigns = (product: Product): string[] => {
        return (product.designs || []).map(d => d.name);
    };

    const getUniqueColors = (product: Product, designName?: string): string[] => {
        if (!designName) {
            const allColors = (product.designs || []).flatMap(d => d.colors.map(c => c.color));
            return [...new Set(allColors)];
        }
        const design = (product.designs || []).find(d => d.name === designName);
        return design ? design.colors.map(c => c.color) : [];
    };

    const getCurrentVariationStock = (product: Product): number => {
        const selectedDesign = selectedDesigns[product.id];
        const selectedColor = selectedColors[product.id];

        if (!selectedDesign && !selectedColor) {
            return (product.designs || []).reduce((total, d) => 
                total + d.colors.reduce((cTotal, c) => cTotal + c.stock, 0), 0);
        }

        if (selectedDesign && !selectedColor) {
            const design = (product.designs || []).find(d => d.name === selectedDesign);
            return design ? design.colors.reduce((total, c) => total + c.stock, 0) : 0;
        }

        if (!selectedDesign && selectedColor) {
            return (product.designs || []).reduce((total, d) => {
                const colorMatch = d.colors.find(c => c.color === selectedColor);
                return total + (colorMatch ? colorMatch.stock : 0);
            }, 0);
        }

        const design = (product.designs || []).find(d => d.name === selectedDesign);
        const colorMatch = design?.colors.find(c => c.color === selectedColor);
        return colorMatch?.stock || 0;
    };

    const calculateDiscount = (product: Product) => {
        const now = new Date();
        const activeDiscounts = discounts.filter(d => {
            const startDate = new Date(d.start_date);
            const endDate = new Date(d.end_date);
            return d.status === 'ACTIVE' && d.is_active && now >= startDate && now <= endDate;
        });

        // 1. PRODUCT level (highest priority) - Find highest value product-specific discount
        const productDiscounts = activeDiscounts.filter(d =>
            d.discount_type === 'PRODUCT' && d.products?.includes(product.id)
        );
        if (productDiscounts.length > 0) {
            return Math.max(...productDiscounts.map(d => d.value));
        }

        // 2. CATEGORY level - Find highest value category-specific discount (checks both local and online)
        const categoryDiscounts = activeDiscounts.filter(d =>
            d.discount_type === 'CATEGORY' && (
                (product.category && d.categories?.includes(product.category.id)) ||
                (product.online_categories && product.online_categories.some(oc => d.online_categories?.includes(oc.id)))
            )
        );
        if (categoryDiscounts.length > 0) {
            return Math.max(...categoryDiscounts.map(d => d.value));
        }

        // 3. APP_WIDE level (lowest priority) - Find highest value truly global discount
        const globalDiscounts = activeDiscounts.filter(d =>
            d.discount_type === 'APP_WIDE' &&
            (!d.products || d.products.length === 0) &&
            (!d.categories || d.categories.length === 0) &&
            (!d.online_categories || d.online_categories.length === 0)
        );
        if (globalDiscounts.length > 0) {
            return Math.max(...globalDiscounts.map(d => d.value));
        }

        return 0;
    };

    if (isLoading) {
        return <GridSkeleton cols={3} rows={2} />;
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium">Error loading products</h3>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => {
                    const designs = getUniqueDesigns(product);
                    const colors = getUniqueColors(product, selectedDesigns[product.id]);
                    const currentStock = getCurrentVariationStock(product);
                    const discountPercent = calculateDiscount(product);
                    const originalPrice = product.retail_price || 0;
                    const discountAmount = (originalPrice * discountPercent) / 100;
                    const finalPrice = originalPrice - discountAmount;

                    return (
                        <Card key={product.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            <div className="relative h-40 bg-slate-100">
                                <img
                                    src={product.image || product.first_variation_image || "/placeholder.svg"}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />

                                {discountPercent > 0 && (
                                    <Badge className="absolute top-2 right-2 bg-red-600">
                                        <Percent className="h-3 w-3 mr-1" />
                                        {discountPercent}% OFF
                                    </Badge>
                                )}

                                <div className="absolute top-2 left-2">
                                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                                        <Barcode className="h-3 w-3 mr-1" />
                                        {product.sku}
                                    </Badge>
                                </div>
                            </div>

                            <CardContent className="p-3 flex-1 flex flex-col">
                                <h3 className="font-semibold text-sm mb-1 truncate" title={product.name}>
                                    {product.name}
                                </h3>

                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-lg font-bold text-slate-900">৳{finalPrice.toLocaleString()}</span>
                                    {discountPercent > 0 && (
                                        <span className="text-xs text-slate-400 line-through">৳{originalPrice.toLocaleString()}</span>
                                    )}
                                </div>

                                {/* Variant Selection */}
                                <div className="space-y-3 mb-4">
                                    {designs.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-medium text-slate-500 uppercase">Design</p>
                                            <div className="flex flex-wrap gap-1">
                                                {designs.map((design) => (
                                                    <button
                                                        key={design}
                                                        onClick={() => setSelectedDesigns({ ...selectedDesigns, [product.id]: design })}
                                                        className={`px-2 py-1 text-xs rounded border transition-colors ${selectedDesigns[product.id] === design
                                                            ? "bg-slate-900 text-white border-slate-900"
                                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                                            }`}
                                                    >
                                                        {design}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {colors.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-medium text-slate-500 uppercase">Color</p>
                                            <div className="flex flex-wrap gap-1">
                                                {colors.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setSelectedColors({ ...selectedColors, [product.id]: color })}
                                                        className={`px-2 py-1 text-xs rounded border transition-colors ${selectedColors[product.id] === color
                                                            ? "bg-slate-900 text-white border-slate-900"
                                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                                            }`}
                                                    >
                                                        {color}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pt-2 border-t flex items-center justify-between gap-2">
                                    <span className={`text-[10px] font-medium ${currentStock === 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                        {currentStock === 0 ? "Out of Stock" : `${currentStock} in stock`}
                                    </span>

                                    <Button
                                        size="sm"
                                        className="h-8 px-3"
                                        disabled={currentStock === 0 || !selectedDesigns[product.id] || !selectedColors[product.id]}
                                        onClick={() => {
                                            const design = (product.designs || []).find(d => d.name === selectedDesigns[product.id]);
                                            const colorVariation = design?.colors.find(c => c.color === selectedColors[product.id]);
                                            
                                            onSelectItem({
                                                product,
                                                design: selectedDesigns[product.id],
                                                color: selectedColors[product.id],
                                                colorHex: colorVariation?.color_hax,
                                                finalPrice,
                                                discountAmount
                                            });
                                        }}
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {products.length === 0 && !isLoading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                        <ShoppingBag className="h-10 w-10 mb-2 opacity-20" />
                        <p>No products found</p>
                    </div>
                )}
            </div>

            {hasNextPage && (
                <div ref={observerTarget} className="flex justify-center py-8">
                    {isFetchingNextPage && (
                        <div className="w-full">
                            <GridSkeleton count={4} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
