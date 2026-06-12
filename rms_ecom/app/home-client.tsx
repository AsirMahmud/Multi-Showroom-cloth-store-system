"use client"

import { useEffect, useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { PromoBanner } from "@/components/promo-banner"
import { HeroSection } from "@/components/hero-section"
import { CategoryCollageSection } from "@/components/category-collage-section"
import { BrandShowcase } from "@/components/brand-showcase"
import { ProductSection } from "@/components/product-section"
import { AdvertisementSection } from "@/components/advertisement-section"
import { FeaturesSection } from "@/components/features-section"
import { NewsletterSection } from "@/components/newsletter-section"
import { SiteFooter } from "@/components/site-footer"
import { ecommerceApi, EcommerceProduct, ProductByColorEntry, ShowcaseResponse, ShowcaseSection } from "@/lib/api"
import { StructuredData } from "@/components/structured-data"
import { generateOrganizationStructuredData, generateWebsiteStructuredData } from "@/lib/seo"
import { useLoading } from "@/hooks/useLoading"

export default function HomePageClient() {
  const [customSections, setCustomSections] = useState<any[] | null>(null);
  const [showcaseData, setShowcaseData] = useState<ShowcaseResponse | null>(null);
  const [catalogFallback, setCatalogFallback] = useState<ProductByColorEntry[]>([]);
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    const loadHome = async () => {
      try {
        startLoading();

        // 1. Fetch dynamic landing page sections
        let sectionsTree: any[] = [];
        try {
          sectionsTree = await ecommerceApi.getLandingPageTree();
        } catch (err) {
          console.error("Failed to load landing page tree, falling back to showcase:", err);
        }

        if (sectionsTree && sectionsTree.length > 0) {
          setCustomSections(sectionsTree);
          return;
        } else {
          setCustomSections([]);
        }

        // 2. Legacy fallback
        let data: ShowcaseResponse = {};
        try {
          data = await ecommerceApi.getShowcase({ limit: 50 });
        } catch (error) {
          console.error("Failed to fetch showcase data:", error);
        }

        setShowcaseData(data);

        const hasShowcaseProducts = Object.values(data).some((section) => (
          section &&
          typeof section === "object" &&
          "products" in section &&
          Array.isArray(section.products) &&
          section.products.length > 0
        ))

        if (!hasShowcaseProducts) {
          try {
            const catalog = await ecommerceApi.getProductsByColorPaginated({
              page: 1,
              page_size: 8,
              only_in_stock: true,
            })
            setCatalogFallback(catalog.results)
          } catch (error) {
            console.error("Failed to fetch catalog fallback:", error);
            setCatalogFallback([])
          }
        } else {
          setCatalogFallback([])
        }
      } finally {
        stopLoading();
      }
    };

    loadHome();
  }, [startLoading, stopLoading]);

  // Transform API data to match component interface
  const toCard = (entry: any) => ({
    id: entry.product_url ? entry.product_url.replace(/^\/product\//, "") : String(entry.product_id),
    name: entry.display_name || entry.product_name,
    price: Number(entry.product_price),
    rating: 4.5,
    image: entry.cover_image_url || "/placeholder.jpg",
    discountInfo: entry.discount_info,
  })

  // Get sections as an array, respecting the order from the API
  const getSortedSections = (data: ShowcaseResponse): Array<{ key: string; section: ShowcaseSection }> => {
    return Object.entries(data).map(([key, section]) => ({ key, section }));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData data={generateOrganizationStructuredData()} />
      <StructuredData data={generateWebsiteStructuredData()} />
      <PromoBanner />
      <SiteHeader />
      <main className="flex-1">
        {customSections && customSections.length > 0 ? (
          /* Render dynamic layout builder sections registry */
          customSections.map((sec) => {
            switch (sec.section_type) {
              case "HERO":
                return (
                  <HeroSection
                    key={sec.id}
                    layoutVariant={sec.layout_variant}
                    config={sec.config}
                    imageUrl={sec.image_url}
                    mobileImageUrl={sec.mobile_image_url}
                  />
                )
              case "CATEGORY_COLLAGE":
                return (
                  <CategoryCollageSection
                    key={sec.id}
                    layoutVariant={sec.layout_variant}
                    config={sec.config}
                    collageItems={sec.collage_items}
                  />
                )
              case "AD_BANNER":
                return (
                  <AdvertisementSection
                    key={sec.id}
                    layoutVariant={sec.layout_variant}
                    imageUrl={sec.image_url}
                    mobileImageUrl={sec.mobile_image_url}
                    config={sec.config}
                  />
                )
              case "PRODUCT_SECTION":
                return (
                  <ProductSection
                    key={sec.id}
                    title={sec.config?.title?.toUpperCase() || "FEATURED PRODUCTS"}
                    products={(sec.products || []).map(toCard)}
                    viewAllHref={sec.config?.view_all_link || "/products"}
                  />
                )
              default:
                return null
            }
          })
        ) : (
          /* Fallback: render legacy static storefront layout */
          <>
            <HeroSection />
            <CategoryCollageSection />
            <BrandShowcase />
            {showcaseData ? (
              <>
                {getSortedSections(showcaseData).map(({ key, section }, index) => (
                  <div key={key}>
                    {index > 0 && <div className="container px-4"><hr className="border-border" /></div>}
                    {section?.products && section?.name && Array.isArray(section.products) && section.products.length > 0 && (
                      <ColorSection
                        title={section.name.toUpperCase()}
                        baseProducts={section.products}
                        toCard={toCard}
                        statusSlug={key}
                      />
                    )}
                  </div>
                ))}
                {catalogFallback.length > 0 ? (
                  <ProductSection
                    title="SHOP THE COLLECTION"
                    products={catalogFallback.map(toCard)}
                    viewAllHref="/products"
                  />
                ) : null}
              </>
            ) : (
              <>
                <ProductSection title="LOADING..." products={[]} isLoading={true} />
                <div className="container px-4"><hr className="border-border" /></div>
                <ProductSection title="LOADING..." products={[]} isLoading={true} />
              </>
            )}
          </>
        )}
        <FeaturesSection />
        <NewsletterSection />
      </main>
      <SiteFooter />
    </div>
  )
}

function ColorSection({ title, baseProducts, toCard, statusSlug }: {
  title: string;
  baseProducts: EcommerceProduct[];
  toCard: (e: ProductByColorEntry) => { id: string; name: string; price: number; rating: number; image: string };
  statusSlug: string;
}) {
  const [entries, setEntries] = useState<ProductByColorEntry[]>([])
  useEffect(() => {
    const load = async () => {
      try {
        const ids = baseProducts.map(p => p.id)
        if (ids.length === 0) { setEntries([]); return }
        const data = await ecommerceApi.getProductsByColor({ product_ids: ids })
        setEntries(data)
      } catch {
        setEntries([])
      }
    }
    load()
  }, [baseProducts])

  return (
    <ProductSection
      title={title}
      products={entries.map(toCard)}
      viewAllHref={`/products?status=${statusSlug}`}
      isLoading={entries.length === 0}
    />
  )
}
