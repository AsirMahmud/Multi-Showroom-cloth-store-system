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
    <div className="group relative min-h-[620px] overflow-hidden bg-slate-950 md:min-h-[800px]">
      <Image
        src={slide.image_url?.startsWith('/images/') ? slide.image_url : getMediaUrl(slide.image_url || slide.image, "/fashion-models-wearing-modern-streetwear.jpg")}
        alt={slide.title}
        fill
        priority
        sizes="100vw"
        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent md:bg-gradient-to-r md:from-slate-950/90 md:via-slate-950/50 md:to-transparent" />
      
      {/* Decorative elegant grain overlay for premium feel */}
      <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('/noise.svg')]" />
      
      <div className="container relative z-10 flex min-h-[620px] items-end py-16 md:min-h-[800px] md:items-center md:py-24">
        <div className="max-w-2xl text-white">
          <p className="mb-4 inline-block overflow-hidden">
            <span className="block translate-y-0 animate-[slideUp_1s_ease-out] text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/90">
              New collection
            </span>
          </p>
          <h1 className="whitespace-pre-line font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-7xl lg:text-[5rem] break-words max-w-full drop-shadow-lg">
            {slide.title}
          </h1>
          {slide.subtitle ? (
            <p className="mt-8 max-w-xl text-base leading-relaxed text-slate-200/90 md:text-lg font-light">
              {slide.subtitle}
            </p>
          ) : null}
          
          <div className="mt-10 md:mt-12">
            <Link
              href="/products" 
              className="group/btn relative inline-flex h-14 items-center gap-4 overflow-hidden bg-white/10 px-8 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all hover:bg-white hover:text-slate-950 border border-white/20 hover:border-white"
            >
              <span className="relative z-10">{slide.button_text || "Shop the collection"}</span>
              <ArrowRight className="relative z-10 size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </Link>
          </div>
          
          {slide.stats?.length ? (
            <div className="mt-16 flex flex-wrap gap-10 border-t border-white/15 pt-8">
              {slide.stats.slice(0, 3).map((stat) => (
                <div key={`${stat.label}-${stat.value}`} className="flex flex-col gap-1">
                  <p className="font-serif text-3xl font-light text-amber-50">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
