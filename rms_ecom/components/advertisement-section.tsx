"use client"

import Image from "next/image"
import Link from "next/link"
import { Play } from "lucide-react"
import { getMediaUrl } from "@/lib/utils"

interface AdvertisementSectionProps {
  layoutVariant: string
  image?: string | null
  imageUrl?: string | null
  mobileImage?: string | null
  mobileImageUrl?: string | null
  config?: {
    heading?: string
    description?: string
    cta_text?: string
    cta_link?: string
    youtube_url?: string
    alignment?: "left" | "center" | "right"
    theme?: "light" | "dark" | "brand"
    autoplay?: boolean
    loop?: boolean
  }
}

export function AdvertisementSection({
  layoutVariant,
  imageUrl,
  mobileImageUrl,
  config = {},
}: AdvertisementSectionProps) {
  const {
    heading,
    description,
    cta_text,
    cta_link,
    youtube_url,
    alignment = "center",
    theme = "dark",
  } = config

  const themeClasses = {
    light: "bg-slate-50 text-slate-900 border border-slate-200",
    dark: "bg-slate-950 text-white",
    brand: "bg-[#fbf7f4] text-foreground",
  }[theme] || "bg-slate-950 text-white"

  const alignClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[alignment] || "text-center items-center"

  const ctaHref = cta_link || "/products"
  const bgImage = imageUrl || "/placeholder.jpg"
  const fallbackImage = mobileImageUrl || bgImage

  // Helper to construct embed query parameters for muted loop autoplay
  const getEmbedUrl = (url: string) => {
    try {
      const videoId = url.split("/embed/")[1]?.split("?")[0]
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&playsinline=1`
      }
      return url
    } catch {
      return url
    }
  }

  // 1. YouTube Video Variant
  if (layoutVariant === "youtube-video" && youtube_url) {
    return (
      <section className="container px-4 py-8 md:py-12">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-slate-950 shadow-xl relative aspect-video">
          <iframe
            src={getEmbedUrl(youtube_url)}
            title={heading || "Advertisement Video"}
            className="absolute inset-0 w-full h-full border-none pointer-events-none scale-105"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          {/* Overlay to allow clicking / scrolling over the video and show text overlays */}
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6 md:p-12 text-white">
            <div className={`max-w-xl space-y-3 ${alignClasses}`}>
              {heading && (
                <h3 className="font-serif text-2xl md:text-4xl leading-tight font-black uppercase tracking-wide">
                  {heading}
                </h3>
              )}
              {description && (
                <p className="text-xs md:text-sm text-white/80 leading-relaxed max-w-md">
                  {description}
                </p>
              )}
              {cta_text && (
                <Link
                  href={ctaHref}
                  className="inline-flex h-9 md:h-10 items-center justify-center rounded-xl bg-white px-5 text-xs font-bold text-slate-900 transition hover:bg-slate-100 mt-2"
                >
                  {cta_text}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // 2. Split Promotional layout
  if (layoutVariant === "split-banner") {
    return (
      <section className="container px-4 py-8 md:py-12">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-slate-100 bg-[#fbf7f4] grid md:grid-cols-2 items-center">
          <div className="relative aspect-video md:aspect-square w-full h-full min-h-[300px] bg-slate-100">
            <Image
              src={bgImage}
              alt={heading || "Promotional banner"}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center space-y-4">
            <div className={`space-y-3 flex flex-col ${alignClasses} text-left md:${alignClasses}`}>
              {heading && (
                <h3 className="font-serif text-2xl md:text-4xl text-slate-950 font-black uppercase tracking-wide leading-tight">
                  {heading}
                </h3>
              )}
              {description && (
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-md">
                  {description}
                </p>
              )}
              {cta_text && (
                <Link
                  href={ctaHref}
                  className="inline-flex h-10 w-fit items-center justify-center rounded-xl bg-slate-950 px-6 text-xs font-bold text-white transition hover:bg-slate-800 mt-2"
                >
                  {cta_text}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // 3. Full-width Image Banner Layout (Default)
  return (
    <section className="container px-4 py-8 md:py-12">
      <div className={`mx-auto max-w-6xl overflow-hidden rounded-[28px] relative h-[320px] md:h-[420px] ${themeClasses}`}>
        {/* Responsive Desktop vs Mobile fallbacks */}
        <div className="absolute inset-0 block sm:hidden">
          <Image
            src={fallbackImage}
            alt={heading || "Promotional banner mobile"}
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 hidden sm:block">
          <Image
            src={bgImage}
            alt={heading || "Promotional banner"}
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black/45" />

        <div className="absolute inset-0 flex flex-col justify-center items-center p-6 md:p-12 text-white">
          <div className={`max-w-xl space-y-3 flex flex-col ${alignClasses}`}>
            {heading && (
              <h3 className="font-serif text-2xl md:text-4xl font-black uppercase tracking-wide leading-tight">
                {heading}
              </h3>
            )}
            {description && (
              <p className="text-xs md:text-sm text-white/90 leading-relaxed max-w-md">
                {description}
              </p>
            )}
            {cta_text && (
              <Link
                href={ctaHref}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-6 text-xs font-bold text-slate-900 transition hover:bg-slate-100 mt-2"
              >
                {cta_text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
