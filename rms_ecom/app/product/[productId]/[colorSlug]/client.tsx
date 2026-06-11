"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { NewsletterSection } from "@/components/newsletter-section"
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
        const run = async () => {
            try {
                if (!productId || !colorSlug) return
                startLoading()
                const response = await ecommerceApi.getProductDetailByColor(productId, colorSlug)
                setData(response)
                const categorySlug = response.product.online_categories?.[0]?.slug
                const [showcase, paginatedResponse] = await Promise.all([
                    ecommerceApi.getProductDetail(productId),
                    ecommerceApi.getProductsByColorPaginated({
                        only_in_stock: true,
                        page_size: 8,
                        page: 1,
                        online_category: categorySlug,
                    }),
                ])
                setProductDescription(showcase.product.description || "")
                setDetailExtras({
                    material_composition: showcase.product.material_composition,
                    who_is_this_for: showcase.product.who_is_this_for,
                    features: showcase.product.features,
                })

                // Fetch products from the same category for "YOU MIGHT ALSO LIKE" section
                // Try to find a primary category slug from the product details
                // Filter out the current product
                const filteredProducts = paginatedResponse.results.filter(
                    entry => entry.product_id !== productId
                )

                setSuggested(filteredProducts.slice(0, 8))
            } catch (e) {
                console.error(e)
                // Redirect to Not Available page if the color/product is not found
                router.replace('/product/not-available')
            } finally {
                stopLoading()
            }
        }
        run()
    }, [productId, colorSlug, router, startLoading, stopLoading])

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
            href: `/product/${pid}/${c.color_slug}`,
            active: c.color_slug === currentSlug,
            oos: (c.total_stock || 0) <= 0,
            hex: c.color_hex || '#000000',
        }))
    }, [data, colorSlug, productId])

    if (!data) return null

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
        variants: sizes.map(s => ({
            size: s.size,
            color: data.color.name,
            color_hex: "#000000",
            stock: s.stock_qty,
            variant_id: 0,
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
                <div className="container pt-10 pb-4 md:pt-16 md:pb-8">
                    <Breadcrumb
                        items={breadcrumbItems}
                    />
                </div>

                <div className="container pt-4 pb-16 md:pt-8 md:pb-24">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_.85fr] lg:gap-16">
                        <ProductGallery images={galleryImages} productName={data.product.name} />
                        <div className="flex flex-col gap-4 lg:gap-5">
                            <ProductInfo
                                productId={`${data.product.id}/${data.color.slug}`}
                                product={productInfo}
                                discountInfo={data.discount_info}
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
                <div className="container px-4 pb-12 lg:pb-16">
                    <ProductTabs
                        description={productDescription}
                        materials={detailExtras?.material_composition || []}
                        whoIsThisFor={detailExtras?.who_is_this_for || []}
                        features={detailExtras?.features || []}
                    />
                </div>

                {/* Random products - YOU MIGHT ALSO LIKE */}
                {(suggested.length > 0 || isLoading) && (
                    <div className="container px-4 pb-12">
                        <ProductRecommendations
                            products={suggested.map(entry => ({
                                id: `${entry.product_id}/${entry.color_slug}`,
                                name: `${entry.product_name} - ${entry.color_name}`,
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

                <NewsletterSection />
            </main>
            <SiteFooter />
        </div>
    )
}
