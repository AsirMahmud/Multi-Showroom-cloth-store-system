import { ProductCard, ProductCardSkeleton } from "@/components/product-card"
import { DiscountInfo } from "@/lib/api"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  discount?: number
  discountInfo?: DiscountInfo | null
}

interface ProductRecommendationsProps {
  products: Product[]
  isLoading?: boolean
}

export function ProductRecommendations({ products, isLoading = false }: ProductRecommendationsProps) {
  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section className="container py-10 lg:py-20">
      <p className="editorial-kicker">Curated for you</p>
      <h2 className="mb-7 mt-2 font-serif text-2xl leading-tight lg:mb-14 lg:text-4xl">Heritage counterparts</h2>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
      </div>
    </section>
  )
}
