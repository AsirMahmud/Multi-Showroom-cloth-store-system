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

export function HeroSection() {
  const [settings, setSettings] = useState<Settings>({})
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
          id: -1,
          title: "Ferdous Textile",
          subtitle: "Traditional Weaves, Timeless Beauty",
          button_text: "Shop the collection",
          image_url: "/hero-slide-1.jpg",
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
          subtitle: "Quality First - ডিজিটাল প্রিন্ট এন্ড ডাইং",
          button_text: "Explore More",
          image_url: "/hero-slide-2.jpg",
          bg_color: "#000000",
          layout: "split",
          title_class: "",
          subtitle_class: "",
          stats: [],
          display_order: -1,
          is_active: true
        }
      ]

      if (slidesResult.status === "fulfilled") {
        const fetchedSlides = slidesResult.value
          .filter((slide) => slide.is_active)
          .sort((a, b) => a.display_order - b.display_order)
        setSlides([...localSlides, ...fetchedSlides])
      } else {
        setSlides(localSlides)
      }

      setLoading(false)
    }

    loadHero()
  }, [])

  if (loading) return <div className="min-h-[620px] animate-pulse bg-muted" />

  if (slides.length) {
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

  const title = [
    settings.hero_heading_line1,
    settings.hero_heading_line2,
    settings.hero_heading_line3,
    settings.hero_heading_line4,
    settings.hero_heading_line5,
  ].filter(Boolean).join(" ")

  return (
    <section className="container py-8 md:py-12">
      <div className="grid min-h-[620px] bg-[#f1e8e3] lg:grid-cols-[.9fr_1.1fr]">
        <div className="flex items-center px-7 py-14 md:px-14">
          <div>
            <p className="editorial-kicker">{settings.hero_badge_text || "New collection"}</p>
            <h1 className="mt-5 max-w-xl font-serif text-5xl leading-[1.02] tracking-[-0.03em] md:text-7xl">
              {title || "Crafted for a life well lived"}
            </h1>
            <p className="mt-6 max-w-lg leading-7 text-muted-foreground">
              {settings.hero_description || "Discover considered silhouettes, expressive colour, and enduring everyday craft."}
            </p>
            <Link href="/products" className="mt-8 inline-flex items-center gap-3 border-b border-foreground pb-2 text-xs font-semibold uppercase tracking-[0.14em]">
              Explore the collection <ArrowRight className="size-4 text-primary" />
            </Link>
          </div>
        </div>
        <div className="relative min-h-[420px] lg:min-h-full">
          <Image
            src={getMediaUrl(settings.hero_primary_image_url, "/fashion-models-wearing-modern-streetwear.jpg")}
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
