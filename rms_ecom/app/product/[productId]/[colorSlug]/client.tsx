"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductGallery } from "@/components/product-gallery"
import { ProductInfo } from "@/components/product-info"
import { Breadcrumb } from "@/components/breadcrumb"
import { ecommerceApi, ProductDetailByColorResponse, ProductByColorEntry } from "@/lib/api"
import { sendGTMEvent } from "@/lib/gtm"
import { ProductRecommendations } from "@/components/product-recommendations"
import { ProductTabs } from "@/components/product-tabs"
import { StructuredData } from "@/components/structured-data"
import { generateProductStructuredData, generateBreadcrumbStructuredData } from "@/lib/seo"
import { useLoading } from "@/hooks/useLoading"

export default function ProductByColorPage() {
    const params = useParams()
    const router = useRouter()
    const productIdParam = params.productId as string
    const colorSlug = params.colorSlug as string

    const [data, setData] = useState<ProductDetailByColorResponse | null>(null)
    const [designSlug, setDesignSlug] = useState("")
    const [combinationId, setCombinationId] = useState<number | undefined>()
    const [suggested, setSuggested] = useState<ProductByColorEntry[]>([])
    const [productDescription, setProductDescription] = useState<string>("")
    const [detailExtras, setDetailExtras] = useState<null | {
        material_composition?: { name: string; percentage: string }[]
        who_is_this_for?: { title: string; description: string }[]
        features?: { title: string; description: string }[]
    }>(null)
    const { isLoading, startLoading, stopLoading } = useLoading()
    const productId = Number(productIdParam)

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        setDesignSlug(searchParams.get("design") || "")
        const rawCombinationId = Number(searchParams.get("combination_id"))
        setCombinationId(rawCombinationId > 0 ? rawCombinationId : undefined)
    }, [])

    useEffect(() => {
        const run = async () => {
            try {
                if (!productId || !colorSlug) return
                startLoading()
                const response = await ecommerceApi.getProductDetailByColor(
                    productId,
                    colorSlug,
                    designSlug || undefined,
                    combinationId,
                )
                setData(response)
                let categorySlug = response.product.online_categories?.[0]?.slug
                if (categorySlug === "undefined" || !categorySlug) {
                    categorySlug = undefined
                }

                // 1. First priority: Try fetching products under the same category
                const [showcase, categoryResponse] = await Promise.all([
                    ecommerceApi.getProductDetail(productId),
                    ecommerceApi.getProductsByColorPaginated({
                        only_in_stock: true,
                        page_size: 20,
                        page: 1,
                        ...(categorySlug ? { online_category: categorySlug } : {}),
                    }).catch(() => ({ results: [] })),
                ])

                setProductDescription(showcase.product.description || "")
                setDetailExtras({
                    material_composition: showcase.product.material_composition,
                    who_is_this_for: showcase.product.who_is_this_for,
                    features: showcase.product.features,
                })

                // Filter out current product from category results
                let related = (categoryResponse.results || []).filter(
                    entry => entry.product_id !== productId
                )

                // 2. If no products (or fewer than 8) under category, fetch random fallback products from general store catalog
                if (related.length < 8) {
                    try {
                        const fallbackResponse = await ecommerceApi.getProductsByColorPaginated({
                            only_in_stock: true,
                            page_size: 30,
                            page: 1,
                        })

                        let randomCatalog = (fallbackResponse.results || []).filter(
                            entry => entry.product_id !== productId
                        )

                        // Shuffle catalog items randomly
                        randomCatalog = randomCatalog.sort(() => 0.5 - Math.random())

                        const existingKeys = new Set(related.map(r => r.combination_id || `${r.product_id}-${r.color_slug}`))
                        for (const item of randomCatalog) {
                            if (related.length >= 8) break
                            const key = item.combination_id || `${item.product_id}-${item.color_slug}`
                            if (!existingKeys.has(key)) {
                                related.push(item)
                                existingKeys.add(key)
                            }
                        }
                    } catch (err) {
                        console.error("Failed to fetch random fallback related products:", err)
                    }
                }

                setSuggested(related.slice(0, 8))
            } catch (e) {
                console.error(e)
                // Redirect to Not Available page if the color/product is not found
                router.replace('/product/not-available')
            } finally {
                stopLoading()
            }
        }
        run()
    }, [productId, colorSlug, designSlug, combinationId, router, startLoading, stopLoading])

    // Fire view_item event for GTM (GTM handles Facebook Pixel via tags)
    useEffect(() => {
        if (!data) return
        const price = Number(data.product.price) || undefined
        const contentId = `${data.product.id}-${data.color.slug}`

        // GTM View Item - GTM triggers Facebook Pixel ViewContent
        sendGTMEvent('view_item', {
            currency: 'BDT',
            value: price,
            items: [{
                item_id: contentId,
                item_name: data.product.name,
                price: price,
                item_variant: data.color.name,
                quantity: 1
            }]
        })
    }, [data])

    // Compute external color toggler links consistently to keep hook order stable
    const colorToggler = useMemo(() => {
        const available = data?.available_colors ?? []
        const currentSlug = data?.color.slug ?? colorSlug
        const pid = data?.product.id ?? productId
        return available.map(c => ({
            name: c.color_name,
            slug: c.color_slug,
            href: `/product/${pid}/${c.color_slug}?design=${encodeURIComponent(data?.design.slug || designSlug)}&combination_id=${c.combination_id}`,
            active: c.color_slug === currentSlug,
            oos: (c.total_stock || 0) <= 0,
            hex: c.color_hex || '#000000',
        }))
    }, [data, colorSlug, designSlug, productId])

    const designToggler = useMemo(() => {
        const available = data?.available_designs ?? []
        const pid = data?.product.id ?? productId
        return available.map(design => ({
            name: design.name,
            href: `/product/${pid}/${design.color_slug}?design=${encodeURIComponent(design.slug)}&combination_id=${design.combination_id}`,
            active: design.slug === data?.design.slug,
            oos: design.total_stock <= 0,
        }))
    }, [data, productId])

    if (!data) {
        return (
            <div className="flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex-1">
                    <div className="container pt-6 pb-3 md:pt-16 md:pb-8">
                        <div className="h-4 w-48 animate-pulse rounded bg-accent"></div>
                    </div>
                    <div className="container pt-3 pb-12 md:pt-8 md:pb-24">
                        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.15fr_.85fr] lg:gap-16">
                            <div className="aspect-[3/4] w-full animate-pulse rounded-none bg-accent"></div>
                            <div className="flex flex-col gap-4 lg:gap-5">
                                <div className="h-10 w-3/4 animate-pulse rounded bg-accent"></div>
                                <div className="h-6 w-1/4 animate-pulse rounded bg-accent"></div>
                                <div className="mt-8 space-y-3">
                                    <div className="h-4 w-full animate-pulse rounded bg-accent"></div>
                                    <div className="h-4 w-5/6 animate-pulse rounded bg-accent"></div>
                                    <div className="h-4 w-4/6 animate-pulse rounded bg-accent"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pb-10">
                        <ProductRecommendations products={[]} isLoading={true} />
                    </div>
                </main>
                <SiteFooter />
            </div>
        )
    }

    const images = data.images ?? []
    const sizes = data.sizes ?? (data.variations ?? []).map((variation) => ({
        size: variation.size || variation.design_name || "Standard",
        stock_qty: variation.stock_qty,
        in_stock: variation.in_stock,
    }))

    const galleryImages = images.length > 0
        ? images.map(i => i.url)
        : []

    // Prepare ProductInfo props (use current color only to drive size stock)
    const productInfo = {
        name: `${data.product.name} - ${data.color.name}`,
        price: Math.round(Number(data.product.price)),
        originalPrice: data.discount_info?.original_price,
        discount: data.discount_info?.discount_value,
        description: productDescription,
        colors: [{ name: data.color.name, value: "#000000" }],
        sizes: sizes.map(s => s.size),
        variants: sizes.map((s, index) => ({
            size: s.size,
            color: data.color.name,
            color_hex: "#000000",
            stock: s.stock_qty,
            variant_id: data.variations?.[index]?.id || data.combination_id,
            combination_id: data.variations?.[index]?.combination_id || data.combination_id,
        }))
    }

    // colorToggler is computed above via useMemo

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "All Products", href: "/products" },
        { label: `${data.product.name} - ${data.color.name}`, href: `/product/${data.product.id}/${data.color.slug}` },
    ]

    return (
        <div className="flex min-h-screen flex-col">
            <StructuredData data={generateProductStructuredData(data)} />
            <StructuredData data={generateBreadcrumbStructuredData(breadcrumbItems)} />
            <SiteHeader />
            <main className="flex-1">
                <div className="container pt-6 pb-3 md:pt-16 md:pb-8">
                    <Breadcrumb
                        items={breadcrumbItems}
                    />
                </div>

                <div className="container pt-3 pb-12 md:pt-8 md:pb-24">
                    <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.15fr_.85fr] lg:gap-16">
                        <ProductGallery images={galleryImages} productName={data.product.name} />
                        <div className="flex flex-col gap-4 lg:gap-5">
                            <ProductInfo
                                productId={`${data.product.id}/${data.color.slug}`}
                                product={productInfo}
                                discountInfo={data.discount_info}
                                designLinks={designToggler}
                                hideVariantSelector
                                colorLinks={colorToggler.map(c => ({ name: c.name, value: c.hex, href: c.href, active: c.active, oos: c.oos }))}
                                onAddToCart={(payload) => {
                                    const price = Number(data.product.price) || undefined
                                    const contentId = `${data.product.id}-${data.color.slug}`

                                    // GTM add_to_cart - GTM triggers Facebook Pixel AddToCart
                                    sendGTMEvent('add_to_cart', {
                                        currency: 'BDT',
                                        value: price ? price * payload.quantity : 0,
                                        items: [{
                                            item_id: contentId,
                                            item_name: data.product.name,
                                            price: price,
                                            item_variant: `${payload.color} - ${payload.size}`,
                                            quantity: payload.quantity
                                        }]
                                    })
                                }}
                                onBuyNow={(payload) => {
                                    const price = Number(data.product.price) || undefined
                                    const contentId = `${data.product.id}-${data.color.slug}`

                                    // GTM begin_checkout - GTM triggers Facebook Pixel InitiateCheckout
                                    sendGTMEvent('begin_checkout', {
                                        currency: 'BDT',
                                        value: price ? price * payload.quantity : 0,
                                        items: [{
                                            item_id: contentId,
                                            item_name: data.product.name,
                                            price: price,
                                            item_variant: `${payload.color} - ${payload.size}`,
                                            quantity: payload.quantity
                                        }]
                                    })
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Product details tabs */}
                <div className="pb-10 lg:pb-16">
                    <ProductTabs
                        description={productDescription}
                        materials={detailExtras?.material_composition || []}
                        whoIsThisFor={detailExtras?.who_is_this_for || []}
                        features={detailExtras?.features || []}
                    />
                </div>

                {/* Random products - YOU MIGHT ALSO LIKE */}
                {(suggested.length > 0 || isLoading) && (
                    <div className="pb-10">
                        <ProductRecommendations
                            products={suggested.map(entry => ({
                                id: entry.product_url.replace(/^\/product\//, ""),
                                name: entry.display_name,
                                price: Number(entry.product_price),
                                originalPrice: entry.discount_info?.original_price,
                                image: entry.cover_image_url || "/placeholder.jpg",
                                discount: entry.discount_info?.discount_value,
                                discountInfo: entry.discount_info,
                            }))}
                            isLoading={isLoading}
                        />
                    </div>
                )}

            </main>
            <SiteFooter />
        </div>
    )
}
