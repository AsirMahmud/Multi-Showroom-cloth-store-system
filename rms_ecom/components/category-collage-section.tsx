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
  badge: "Curated for You",
  heading: "Pakistani Three Piece Edit",
  description: "Signature silhouettes, refined embroidery, and festive color stories selected for everyday elegance and occasion wear.",
  cards: [
    {
      title: "Women",
      subtitle: "Shop three piece",
      link: "/women",
      imageUrl: "/pakistani-three-piece-collage.png",
      layout: "large" as const,
    },
    {
      title: "Festive Wear",
      subtitle: "New arrivals",
      link: "/products",
      imageUrl: "/hero-slide-2.jpg",
      layout: "wide" as const,
    },
    {
      title: "Printed Lawn",
      subtitle: "Daily elegance",
      link: "/products",
      imageUrl: "/party-evening-wear.jpg",
      layout: "small" as const,
    },
    {
      title: "Embroidered Edit",
      subtitle: "Occasion ready",
      link: "/products",
      imageUrl: "/fashion-models-wearing-modern-streetwear.jpg",
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

  useEffect(() => {
    if (isDynamic) {
      setLoading(false)
      return
    }

    const loadSettings = async () => {
      try {
        const data = await ecommerceApi.getHomePageSettings()
        setSettings(data)
      } catch {
        setSettings({})
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [isDynamic])

  // Process cards based on source
  const cards = useMemo<CardConfig[]>(() => {
    if (isDynamic && collageItems) {
      return collageItems.map((item, idx) => ({
        title: item.title_override || "Explore",
        subtitle: "Shop now",
        link: item.link_override || "/products",
        imageUrl: item.image_url || "/placeholder.jpg"
      }))
    }

    return [
      {
        title: settings.collage_card_1_title || fallbackContent.cards[0].title,
        subtitle: settings.collage_card_1_subtitle || fallbackContent.cards[0].subtitle,
        link: settings.collage_card_1_link || fallbackContent.cards[0].link,
        imageUrl: settings.collage_card_1_image_url || fallbackContent.cards[0].imageUrl,
        layout: "large",
      },
      {
        title: settings.collage_card_2_title || fallbackContent.cards[1].title,
        subtitle: settings.collage_card_2_subtitle || fallbackContent.cards[1].subtitle,
        link: settings.collage_card_2_link || fallbackContent.cards[1].link,
        imageUrl: settings.collage_card_2_image_url || fallbackContent.cards[1].imageUrl,
        layout: "wide",
      },
      {
        title: settings.collage_card_3_title || fallbackContent.cards[2].title,
        subtitle: settings.collage_card_3_subtitle || fallbackContent.cards[2].subtitle,
        link: settings.collage_card_3_link || fallbackContent.cards[2].link,
        imageUrl: settings.collage_card_3_image_url || fallbackContent.cards[2].imageUrl,
        layout: "small",
      },
      {
        title: settings.collage_card_4_title || fallbackContent.cards[3].title,
        subtitle: settings.collage_card_4_subtitle || fallbackContent.cards[3].subtitle,
        link: settings.collage_card_4_link || fallbackContent.cards[3].link,
        imageUrl: settings.collage_card_4_image_url || fallbackContent.cards[3].imageUrl,
        layout: "small",
      },
    ]
  }, [settings, isDynamic, collageItems])

  const visibleCards = cards.filter((card) => card.title || card.imageUrl || card.link)
  const isEnabled = isDynamic ? true : (settings.collage_enabled ?? true)

  if ((!loading && !isEnabled) || visibleCards.length === 0) {
    return null
  }

  const badgeText = isDynamic ? (config.collage_badge_text || "Curated collections") : (settings.collage_badge_text || fallbackContent.badge)
  const headingText = isDynamic ? (config.collage_heading || "") : (settings.collage_heading || fallbackContent.heading)
  const descriptionText = isDynamic ? (config.collage_description || "") : (settings.collage_description || fallbackContent.description)

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

        {/* 6. Default Four Card Grid (Legacy default & fallbacks) */}
        {(!isDynamic || layoutVariant === "four-card-grid") && (
          <div className="grid gap-4 md:grid-cols-[1.05fr_.95fr]">
            <CollageCard card={cards[0]} className="min-h-[320px] md:min-h-[620px]" />

            <div className="grid gap-4">
              <CollageCard card={cards[1]} className="min-h-[220px] md:min-h-[300px]" />
              <div className="grid gap-4 sm:grid-cols-2">
                <CollageCard card={cards[2]} className="min-h-[200px] md:min-h-[300px]" />
                <CollageCard card={cards[3]} className="min-h-[200px] md:min-h-[300px]" />
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
