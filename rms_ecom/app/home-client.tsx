"use client"

import { useEffect, useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { PromoBanner } from "@/components/promo-banner"
import { HeroSection } from "@/components/hero-section"
import { CategoryCollageSection } from "@/components/category-collage-section"
import { ProductSection } from "@/components/product-section"
import { FeaturesSection } from "@/components/features-section"
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

        // 1. Fetch both showcase data (dynamic product status sections) and landing page tree
        const [showcaseResult, treeResult] = await Promise.allSettled([
          ecommerceApi.getShowcase({ limit: 12 }),
          ecommerceApi.getLandingPageTree(),
        ]);

        if (showcaseResult.status === "fulfilled") {
          setShowcaseData(showcaseResult.value);
        }

        if (treeResult.status === "fulfilled" && treeResult.value && treeResult.value.length > 0) {
          setCustomSections(treeResult.value);
        } else {
          setCustomSections([]);
        }

        const data = showcaseResult.status === "fulfilled" ? showcaseResult.value : {};
        const hasShowcaseProducts = Object.values(data).some((section) => (
          section &&
          typeof section === "object" &&
          "products" in section &&
          Array.isArray(section.products) &&
          section.products.length > 0
        ));

        if (!hasShowcaseProducts) {
          try {
            const catalog = await ecommerceApi.getProductsByColorPaginated({
              page: 1,
              page_size: 8,
              only_in_stock: true,
            });
            setCatalogFallback(catalog.results || []);
          } catch (error) {
            console.error("Failed to fetch catalog fallback:", error);
            setCatalogFallback([]);
          }
        } else {
          setCatalogFallback([]);
        }
      } finally {
        stopLoading();
      }
    };

    loadHome();
  }, [startLoading, stopLoading]);

  // Transform API data to match component interface
  const toCard = (entry: any) => ({
    id: entry.product_url ? entry.product_url.replace(/^\/product\//, "") : String(entry.product_id || entry.id),
    name: entry.display_name || entry.product_name || entry.name,
    price: Number(entry.product_price || entry.selling_price || 0),
    originalPrice: entry.discount_info?.original_price || (entry.original_price ? Number(entry.original_price) : undefined),
    rating: 4.5,
    image: entry.cover_image_url || entry.image_url || entry.primary_image || entry.image || "/placeholder.jpg",
    discountInfo: entry.discount_info,
  });

  // Get sections as an array, respecting the order from the API
  const getSortedSections = (data: ShowcaseResponse): Array<{ key: string; section: ShowcaseSection }> => {
    return Object.entries(data).map(([key, section]) => ({ key, section }));
  };

  const renderShowcaseSections = () => {
    if (!showcaseData) return null;
    const sections = getSortedSections(showcaseData);
    const activeSections = sections.filter(
      ({ key, section }) =>
        key !== "dynamic_section_slugs" &&
        key !== "online_category" &&
        section?.products &&
        Array.isArray(section.products) &&
        section.products.length > 0
    );

    if (activeSections.length === 0 && catalogFallback.length > 0) {
      return (
        <ProductSection
          title="SHOP THE COLLECTION"
          products={catalogFallback.map(toCard)}
          viewAllHref="/products"
        />
      );
    }

    return activeSections.map(({ key, section }, index) => (
      <div key={key}>
        {index > 0 && <div className="container px-4"><hr className="border-border" /></div>}
        <ColorSection
          title={section.name.toUpperCase()}
          baseProducts={section.products}
          toCard={toCard}
          statusSlug={key}
        />
      </div>
    ));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData data={generateOrganizationStructuredData()} />
      <StructuredData data={generateWebsiteStructuredData()} />
      <PromoBanner />
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <CategoryCollageSection />
        {renderShowcaseSections()}
        <FeaturesSection />
      </main>
      <SiteFooter />
    </div>
  )
}

function ColorSection({ title, baseProducts, toCard, statusSlug }: {
  title: string;
  baseProducts: EcommerceProduct[];
  toCard: (e: any) => { id: string; name: string; price: number; rating: number; image: string; originalPrice?: number; discountInfo?: any };
  statusSlug: string;
}) {
  const [entries, setEntries] = useState<ProductByColorEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const ids = baseProducts.map(p => p.id)
        if (ids.length === 0) { setEntries([]); return }
        const data = await ecommerceApi.getProductsByColor({ product_ids: ids, status: statusSlug })
        if (data && data.length > 0) {
          setEntries(data)
        } else {
          setEntries([])
        }
      } catch {
        setEntries([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [baseProducts, statusSlug])

  // Fallback to baseProducts directly if per-color entries are not available
  const formattedProducts = entries.length > 0
    ? entries.map(toCard)
    : baseProducts.map(toCard)

  if (!loading && formattedProducts.length === 0) return null;

  return (
    <ProductSection
      title={title}
      products={formattedProducts}
      viewAllHref={`/products?status=${statusSlug}`}
      isLoading={loading}
    />
  )
}
