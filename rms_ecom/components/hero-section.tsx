"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import { ArrowRight } from "lucide-react"
import { ecommerceApi } from "@/lib/api"
import { getMediaUrl } from "@/lib/utils"
import { HeroSlide } from "@/components/hero-slide"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

type Settings = Awaited<ReturnType<typeof ecommerceApi.getHomePageSettings>>
type Slide = Awaited<ReturnType<typeof ecommerceApi.getHeroSlides>>[number]

interface HeroSectionProps {
  layoutVariant?: string
  config?: {
    hero_badge_text?: string
    hero_heading_line1?: string
    hero_heading_line2?: string
    hero_heading_line3?: string
    hero_heading_line4?: string
    hero_heading_line5?: string
    title?: string
    hero_description?: string
    cta_text?: string
    cta_link?: string
    alignment?: "left" | "center" | "right"
  }
  imageUrl?: string | null
  mobileImageUrl?: string | null
}

export function HeroSection({
  layoutVariant,
  config = {},
  imageUrl,
  mobileImageUrl,
}: HeroSectionProps = {}) {
  const [settings, setSettings] = useState<Settings>({})
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)

  const isDynamic = typeof layoutVariant !== 'undefined'

  useEffect(() => {
    if (isDynamic && layoutVariant !== "slider") {
      setLoading(false)
      return
    }

    const loadHero = async () => {
      const [settingsResult, slidesResult] = await Promise.allSettled([
        ecommerceApi.getHomePageSettings(),
        ecommerceApi.getHeroSlides(),
      ])

      if (settingsResult.status === "fulfilled") {
        setSettings(settingsResult.value)
      }

      const localSlides: Slide[] = [
        {
          id: -102,
          title: "Precision Craftsmanship\n& Intricate Embroidery",
          subtitle: "High-density stitching, delicate neckline patches, and intricate dupatta borders crafted on advanced computerized multi-head embroidery machinery.",
          button_text: "View Embroidery Edit",
          image_url: "/images/three-piece/embroidery_facility.jpg",
          bg_color: "#000000",
          layout: "split",
          title_class: "",
          subtitle_class: "",
          stats: [],
          display_order: -5,
          is_active: true
        },
        {
          id: -103,
          title: "Vibrant Dyeing &\nDigital Print Art",
          subtitle: "State-of-the-art reactive digital printing technology ensuring brilliant hues, long-lasting color fastness, and ultra-soft breathable cotton fabrics.",
          button_text: "Shop Printed Lawn",
          image_url: "/images/three-piece/digital_printing_facility.jpg",
          bg_color: "#000000",
          layout: "split",
          title_class: "",
          subtitle_class: "",
          stats: [],
          display_order: -4,
          is_active: true
        },
        {
          id: -101,
          title: "Ferdous Textile\nAraihazar Facility",
          subtitle: "Welcome to our primary textile facility & corporate office in Araihazar, Narayanganj. Explore luxury 3-piece unstitched lawn & cotton collections directly from the source.",
          button_text: "Explore Outlet",
          image_url: "/images/three-piece/factory_office.jpg",
          bg_color: "#000000",
          layout: "split",
          title_class: "",
          subtitle_class: "",
          stats: [],
          display_order: -3,
          is_active: true
        },
        {
          id: -1,
          title: "The Signature Edit",
          subtitle: "Discover our luxurious 3-Piece unstitched lawn and cotton collection, crafted with meticulous embroidery and premium fabrics.",
          button_text: "Explore Collection",
          image_url: "/images/three-piece/ai_hero_1.png",
          bg_color: "#000000",
          layout: "split",
          title_class: "",
          subtitle_class: "",
          stats: [],
          display_order: -2,
          is_active: true
        },
        {
          id: -2,
          title: "ফেরদৌস টেক্সটাইল",
          subtitle: "অতুলনীয় সুতি ও লন থ্রি-পিস কালেকশন - প্রিমিয়াম কোয়ালিটির নিশ্চয়তা",
          button_text: "সকল কালেকশন দেখুন",
          image_url: "/images/three-piece/ai_hero_2.png",
          bg_color: "#000000",
          layout: "split",
          title_class: "",
          subtitle_class: "",
          stats: [],
          display_order: -1,
          is_active: true
        }
      ]

      setSlides(localSlides)

      setLoading(false)
    }

    loadHero()
  }, [isDynamic, layoutVariant])

  if (loading) return <div className="min-h-[620px] animate-pulse bg-muted" />

  // Dynamic values
  const displayTitle = [
    config.hero_heading_line1,
    config.hero_heading_line2,
    config.hero_heading_line3,
    config.hero_heading_line4,
    config.hero_heading_line5,
  ].filter(Boolean).join(" ") || config.title || "Crafted for a life well lived"

  const badgeText = config.hero_badge_text || "New collection"
  const description = config.hero_description || "Discover considered silhouettes, expressive colour, and enduring everyday craft."
  const ctaLabel = config.cta_text || "Explore the collection"
  const ctaHref = config.cta_link || "/products"
  const align = config.alignment || "left"

  const alignClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[align] || "text-left items-start"

  // 1. Slider layout (both legacy slider & dynamic slider)
  if ((isDynamic && layoutVariant === "slider") || (!isDynamic && slides.length > 0)) {
    return (
      <section aria-label="Featured collections">
        <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 6000, stopOnInteraction: false })]}>
          <CarouselContent>
            {slides.map((slide) => <CarouselItem key={slide.id}><HeroSlide slide={slide} /></CarouselItem>)}
          </CarouselContent>
          {slides.length > 1 ? (
            <>
              <CarouselPrevious className="left-5 hidden border-white/40 bg-transparent text-white hover:bg-white hover:text-foreground md:flex" />
              <CarouselNext className="right-5 hidden border-white/40 bg-transparent text-white hover:bg-white hover:text-foreground md:flex" />
            </>
          ) : null}
        </Carousel>
      </section>
    )
  }

  // 2. Single Full Width Image Layout
  if (isDynamic && layoutVariant === "single-image") {
    const mainImg = imageUrl || "/fashion-models-wearing-modern-streetwear.jpg"
    return (
      <section className="container py-8 md:py-12">
        <div className="relative h-[520px] md:h-[620px] rounded-[28px] overflow-hidden flex flex-col justify-center p-8 bg-slate-900 text-white">
          <Image
            src={mainImg}
            alt="Hero collection image"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className={`relative max-w-xl space-y-4 mx-auto flex flex-col ${alignClasses}`}>
            <p className="editorial-kicker text-white/95">{badgeText}</p>
            <h1 className="font-serif text-4xl md:text-7xl uppercase leading-[1.05] tracking-tight text-white font-black">
              {displayTitle}
            </h1>
            <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-md">
              {description}
            </p>
            <Link
              href={ctaHref}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-xs font-bold text-slate-900 transition hover:bg-slate-100 mt-2"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // 3. Split Image & Text Layout
  const primaryImg = imageUrl
    ? imageUrl
    : isDynamic
      ? "/fashion-models-wearing-modern-streetwear.jpg"
      : getMediaUrl(settings.hero_primary_image_url, "/fashion-models-wearing-modern-streetwear.jpg")

  return (
    <section className="container py-8 md:py-12">
      <div className="grid min-h-[620px] bg-[#f1e8e3] rounded-[28px] overflow-hidden lg:grid-cols-[.9fr_1.1fr]">
        <div className="flex items-center px-7 py-14 md:px-14">
          <div className={`flex flex-col ${isDynamic ? alignClasses : "text-left items-start"}`}>
            <p className="editorial-kicker">{badgeText}</p>
            <h1 className="mt-5 max-w-xl font-serif text-5xl leading-[1.02] tracking-[-0.03em] md:text-7xl">
              {displayTitle}
            </h1>
            <p className="mt-6 max-w-lg leading-7 text-muted-foreground">
              {description}
            </p>
            <Link href={ctaHref} className="mt-8 inline-flex items-center gap-3 border-b border-foreground pb-2 text-xs font-semibold uppercase tracking-[0.14em]">
              {ctaLabel} <ArrowRight className="size-4 text-primary" />
            </Link>
          </div>
        </div>
        <div className="relative min-h-[420px] lg:min-h-full">
          <Image
            src={primaryImg}
            alt="Ferdous Textile collection"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
