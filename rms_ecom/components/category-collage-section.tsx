"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ecommerceApi } from "@/lib/api"
import { getMediaUrl } from "@/lib/utils"

type Settings = Awaited<ReturnType<typeof ecommerceApi.getHomePageSettings>>

type CardConfig = {
  title?: string
  subtitle?: string
  link?: string
  imageUrl?: string
  layout?: "large" | "wide" | "small"
}

interface CategoryCollageSectionProps {
  layoutVariant?: string
  config?: {
    collage_badge_text?: string
    collage_heading?: string
    collage_description?: string
    spacing?: "small" | "medium" | "large"
  }
  collageItems?: Array<{
    id: number
    title_override?: string | null
    link_override?: string | null
    image_url?: string | null
  }>
}

const fallbackContent = {
  badge: "Ferdous Textile Signature",
  heading: "Three Piece Collections",
  description: "Explore our exclusive range of unstitched Bangladeshi & Pakistani 3-piece suit collections carefully designed for every occasion.",
  cards: [
    {
      title: "Pakistani Three Piece",
      subtitle: "Luxury Embroidered Edit",
      link: "/category/pakistani-three-piece",
      imageUrl: "/images/three-piece/cat_pakistani.png",
      layout: "large" as const,
    },
    {
      title: "Summer Lawn",
      subtitle: "Breathable Daily Wear",
      link: "/category/summer-lawn",
      imageUrl: "/images/three-piece/cat_summer_lawn.png",
      layout: "wide" as const,
    },
    {
      title: "Jam Jam Cotton",
      subtitle: "Vibrant Printed Suit",
      link: "/category/jam-jam-cotton",
      imageUrl: "/images/three-piece/cat_jam_jam.png",
      layout: "small" as const,
    },
    {
      title: "Luxury Formal",
      subtitle: "Occasion Ready",
      link: "/category/luxury-formal",
      imageUrl: "/images/three-piece/cat_luxury_formal.png",
      layout: "small" as const,
    },
    {
      title: "Festive Chiffon",
      subtitle: "Elegance Redefined",
      link: "/category/festive-chiffon",
      imageUrl: "/images/three-piece/cat_festive_chiffon.png",
      layout: "small" as const,
    },
  ],
}

export function CategoryCollageSection({
  layoutVariant,
  config = {},
  collageItems,
}: CategoryCollageSectionProps = {}) {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)

  const isDynamic = typeof layoutVariant !== 'undefined'

  const cards = fallbackContent.cards
  const isEnabled = true

  if (!isEnabled || cards.length === 0) {
    return null
  }

  const badgeText = fallbackContent.badge
  const headingText = fallbackContent.heading
  const descriptionText = fallbackContent.description

  return (
    <section className="container px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          {badgeText && (
            <p className="font-serif text-sm text-[#b7773c]">
              {badgeText}
            </p>
          )}
          {headingText && (
            <h2 className="mt-2 font-serif text-3xl text-slate-900 md:text-4xl">
              {headingText}
            </h2>
          )}
          {descriptionText && (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              {descriptionText}
            </p>
          )}
        </div>

        {/* 1. Dynamic Layout: Two Equal Cards */}
        {isDynamic && layoutVariant === "two-equal" && (
          <div className="grid gap-6 md:grid-cols-2">
            {cards.slice(0, 2).map((card, i) => (
              <CollageCard key={i} card={card} className="min-h-[320px] md:min-h-[480px]" />
            ))}
          </div>
        )}

        {/* 2. Dynamic Layout: Three-card editorial */}
        {isDynamic && layoutVariant === "three-card-editorial" && (
          <div className="grid gap-6 md:grid-cols-3">
            <CollageCard card={cards[0]} className="min-h-[320px] md:min-h-[500px] md:col-span-2" />
            <div className="grid gap-4">
              <CollageCard card={cards[1]} className="min-h-[200px]" />
              <CollageCard card={cards[2]} className="min-h-[200px]" />
            </div>
          </div>
        )}

        {/* 3. Dynamic Layout: One Large Plus Three Small */}
        {isDynamic && layoutVariant === "one-large-three-small" && (
          <div className="grid gap-6 md:grid-cols-[1.2fr_.8fr]">
            <CollageCard card={cards[0]} className="min-h-[320px] md:min-h-[580px]" />
            <div className="grid gap-4">
              {cards.slice(1, 4).map((card, idx) => (
                <CollageCard key={idx} card={card} className="min-h-[160px]" />
              ))}
            </div>
          </div>
        )}

        {/* 4. Dynamic Layout: Horizontal cards scroll */}
        {isDynamic && layoutVariant === "horizontal-cards" && (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {cards.map((card, idx) => (
              <CollageCard key={idx} card={card} className="min-h-[280px] w-[260px] md:w-[320px] shrink-0" />
            ))}
          </div>
        )}

        {/* 5. Dynamic Layout: Masonry layout */}
        {isDynamic && layoutVariant === "masonry-collage" && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <CollageCard card={cards[0]} className="min-h-[380px]" />
            <CollageCard card={cards[1]} className="min-h-[280px]" />
            <CollageCard card={cards[2]} className="min-h-[480px]" />
            {cards[3] && <CollageCard card={cards[3]} className="min-h-[280px]" />}
          </div>
        )}

        {/* 6. Default Category Collage Grid */}
        {(!isDynamic || layoutVariant === "four-card-grid") && (
          <div className="grid gap-4 md:grid-cols-[1.05fr_.95fr]">
            <CollageCard card={cards[0]} className="min-h-[320px] md:min-h-[640px]" />

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <CollageCard card={cards[1]} className="min-h-[220px] md:min-h-[310px]" />
                <CollageCard card={cards[2]} className="min-h-[220px] md:min-h-[310px]" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <CollageCard card={cards[3]} className="min-h-[200px] md:min-h-[310px]" />
                {cards[4] && <CollageCard card={cards[4]} className="min-h-[200px] md:min-h-[310px]" />}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function CollageCard({ card, className }: { card: CardConfig; className: string }) {
  if (!card || (!card.title && !card.imageUrl && !card.link)) {
    return null
  }

  const href = card.link || "/products"
  const imageSrc = card.imageUrl?.startsWith("/")
    ? card.imageUrl
    : getMediaUrl(card.imageUrl, "/placeholder.jpg")

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-[28px] bg-[#e9ddd4] ${className}`}
    >
      <Image
        src={imageSrc}
        alt={card.title || "Category collage"}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
        <h3 className="font-serif text-2xl uppercase tracking-wide md:text-3xl">{card.title || "Explore"}</h3>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-white/85">
          {card.subtitle || "Shop now"}
        </p>
      </div>
    </Link>
  )
}
