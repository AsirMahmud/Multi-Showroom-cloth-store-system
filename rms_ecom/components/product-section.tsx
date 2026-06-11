import { Button } from "@/components/ui/button"
import { ProductCard, ProductCardSkeleton } from "@/components/product-card"
import Link from "next/link"
import { DiscountInfo } from "@/lib/api"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  rating: number
  image: string
  discount?: number
  discountInfo?: DiscountInfo | null
}

interface ProductSectionProps {
  title: string
  products: Product[]
  viewAllHref?: string
  isLoading?: boolean
}

export function ProductSection({ title, products, viewAllHref = "/products", isLoading = false }: ProductSectionProps) {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="editorial-kicker">Curated for you</p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl">{title}</h2>
          </div>
          <Link href={viewAllHref} className="hidden border-b border-foreground pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] sm:block">
            View collection
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
        </div>
        <div className="mt-12 flex justify-center sm:hidden">
          <Link href={viewAllHref}>
            <Button variant="outline" size="lg">
              View All
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
