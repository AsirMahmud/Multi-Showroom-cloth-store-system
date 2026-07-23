"use client"

import { useEffect, useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Breadcrumb } from "@/components/breadcrumb"
import { ProductGrid } from "@/components/product-grid"
import { ecommerceApi, ProductByColorEntry } from "@/lib/api"
import { StructuredData } from "@/components/structured-data"
import { generateBreadcrumbStructuredData } from "@/lib/seo"
import { useLoading } from "@/hooks/useLoading"

export default function UnisexCollectionPage() {
  const [products, setProducts] = useState<ProductByColorEntry[]>([])
  const { startLoading, stopLoading } = useLoading()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(24)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const run = async () => {
      startLoading()
      try {
        // Filter by gender: 'UNISEX' - shows only UNISEX products
        const resp = await ecommerceApi.getProductsByColorPaginated({ 
          gender: 'UNISEX', 
          page, 
          page_size: pageSize 
        })
        setProducts(resp.results)
        setTotalCount(resp.count)
      } finally {
        stopLoading()
      }
    }
    run()
  }, [page, pageSize, startLoading, stopLoading])

  const breadcrumbItems = [
    { label: "Home", href: "/" }, 
    { label: "Unisex", href: "/unisex" }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData data={generateBreadcrumbStructuredData(breadcrumbItems)} />
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <Breadcrumb items={breadcrumbItems} />

          <div className="mt-6 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Unisex</h1>
            <p className="text-muted-foreground">Explore unisex products for everyone</p>
          </div>

          <ProductGrid
              category={`Unisex`}
              products={products.map((item) => ({
                id: item.product_url.replace(/^\/product\//, ""),
                name: item.display_name,
                price: Number(item.product_price),
                rating: 4.5,
                image: item.cover_image_url || "/placeholder.jpg",
              }))}
              totalCount={totalCount}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
            />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
