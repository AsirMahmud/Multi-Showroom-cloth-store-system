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
  layout: "large" | "wide" | "small"
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

export function CategoryCollageSection() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [])

  const cards = useMemo<CardConfig[]>(() => ([
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
  ]), [settings])

  const visibleCards = cards.filter((card) => card.title || card.imageUrl || card.link)
  const isEnabled = settings.collage_enabled ?? true

  if ((!loading && !isEnabled) || visibleCards.length === 0) {
    return null
  }

  return (
    <section className="container px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <p className="font-serif text-sm text-[#b7773c]">
            {settings.collage_badge_text || fallbackContent.badge}
          </p>
          {settings.collage_heading || fallbackContent.heading ? (
            <h2 className="mt-2 font-serif text-3xl text-foreground md:text-4xl">
              {settings.collage_heading || fallbackContent.heading}
            </h2>
          ) : null}
          {settings.collage_description || fallbackContent.description ? (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              {settings.collage_description || fallbackContent.description}
            </p>
          ) : null}
        </div>

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
      </div>
    </section>
  )
}

function CollageCard({ card, className }: { card: CardConfig; className: string }) {
  if (!card.title && !card.imageUrl && !card.link) {
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
