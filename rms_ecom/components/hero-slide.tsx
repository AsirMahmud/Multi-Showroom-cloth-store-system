import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getMediaUrl } from "@/lib/utils"

export interface HeroSlideProps {
  slide: {
    id: number
    title: string
    subtitle?: string
    button_text: string
    image?: string
    image_url?: string
    stats: Array<{ value: string; label: string }>
  }
}

export function HeroSlide({ slide }: HeroSlideProps) {
  return (
    <div className="relative min-h-[620px] overflow-hidden bg-[#2f3032] md:min-h-[720px]">
      <Image
        src={getMediaUrl(slide.image_url || slide.image, "/fashion-models-wearing-modern-streetwear.jpg")}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
      <div className="container relative z-10 flex min-h-[620px] items-end py-16 md:min-h-[720px] md:items-center md:py-24">
        <div className="max-w-2xl text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffb59e]">New collection</p>
          <h1 className="mt-5 whitespace-pre-line font-serif text-5xl leading-[1.02] tracking-[-0.03em] sm:text-6xl md:text-7xl">
            {slide.title}
          </h1>
          {slide.subtitle ? <p className="mt-6 max-w-xl text-base leading-7 text-white/80 md:text-lg">{slide.subtitle}</p> : null}
          <Link href="/products" className="mt-8 inline-flex h-12 items-center gap-3 bg-primary px-7 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#842500]">
            {slide.button_text || "Shop the collection"} <ArrowRight className="size-4" />
          </Link>
          {slide.stats?.length ? (
            <div className="mt-10 flex flex-wrap gap-8 border-t border-white/25 pt-6">
              {slide.stats.slice(0, 3).map((stat) => (
                <div key={`${stat.label}-${stat.value}`}>
                  <p className="font-serif text-2xl">{stat.value}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
