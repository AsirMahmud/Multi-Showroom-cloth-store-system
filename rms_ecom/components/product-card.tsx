"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { type DiscountInfo } from "@/lib/api"
import { formatCurrency, normalizeProductPrice } from "@/lib/utils"
import { ProductSizeModal } from "@/components/product-size-modal"
import { Skeleton } from "@/components/ui/skeleton"

interface ProductCardProps {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  discount?: number
  discountInfo?: DiscountInfo | null
}

export function ProductCard({ id, name, price, originalPrice, image, discount, discountInfo }: ProductCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const original = normalizeProductPrice(discountInfo?.original_price ?? originalPrice ?? price)
  const final = normalizeProductPrice(
    discountInfo?.final_price ?? (discount ? original * (1 - discount / 100) : price)
  )
  const discountValue = Number(discountInfo?.discount_value ?? discount ?? 0)
  const [productName, colorName] = splitProductName(name)

  return (
    <>
      <article className="group min-w-0">
        <Link href={`/product/${id}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden bg-muted">
            {discountValue > 0 ? (
              <span className="absolute left-3 top-3 z-10 bg-primary px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                {Math.round(discountValue)}% off
              </span>
            ) : null}
            <Image
              src={image || "/placeholder.jpg"}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
            />
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                setModalOpen(true)
              }}
              className="absolute inset-x-2 bottom-2 md:inset-x-3 md:bottom-3 flex translate-y-0 opacity-100 md:translate-y-3 items-center justify-center gap-1.5 md:gap-2 bg-white/95 py-2 md:py-3 text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.1em] md:tracking-[0.14em] md:opacity-0 shadow-sm transition-all md:group-hover:translate-y-0 md:group-hover:opacity-100 focus:translate-y-0 focus:opacity-100 rounded-sm md:rounded-none"
            >
              <ShoppingBag className="size-3.5 md:size-4" /> Quick add
            </button>
          </div>
          <div className="pt-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{colorName || "Ferdous Textile"}</p>
            <h3 className="mt-1 line-clamp-2 font-serif text-base leading-6">{productName}</h3>
            <div className="mt-1.5 flex items-center gap-2 text-sm">
              <span>{formatCurrency(final)}</span>
              {discountValue > 0 ? <span className="text-muted-foreground line-through">{formatCurrency(original)}</span> : null}
            </div>
          </div>
        </Link>
      </article>
      <ProductSizeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={id}
        productName={name}
        productImage={image}
        productPrice={final}
        productOriginalPrice={original}
        productDiscount={discountValue}
        actionType="addToCart"
      />
    </>
  )
}

function splitProductName(value: string): [string, string] {
  const parts = value.split(" - ")
  return [parts[0], parts.slice(1).join(" - ")]
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <Skeleton className="mt-4 h-3 w-20" />
      <Skeleton className="mt-2 h-5 w-4/5" />
      <Skeleton className="mt-2 h-4 w-24" />
    </div>
  )
}
