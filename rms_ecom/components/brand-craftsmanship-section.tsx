"use client"

import Image from "next/image"
import Link from "next/link"
import { Sparkles, ShieldCheck, Palette, Scissors, ArrowRight } from "lucide-react"

export function BrandCraftsmanshipSection() {
  const highlights = [
    {
      icon: Sparkles,
      title: "100% Pure Lawn & Cotton",
      description: "Breathable, high-density cotton fabrics designed for maximum comfort and long-lasting durability.",
    },
    {
      icon: Palette,
      title: "Vibrant Color Fastness",
      description: "Digital printing and reactive dyeing technology ensuring brilliant colors that never fade.",
    },
    {
      icon: Scissors,
      title: "Exclusive Embroideries",
      description: "Intricate neckline patches, heavy dupatta borders, and tasteful paisley craft details.",
    },
    {
      icon: ShieldCheck,
      title: "Direct Outlet Pricing",
      description: "Unmatched wholesale and retail value directly from our Araihazar, Narayanganj textile facility.",
    },
  ]

  return (
    <section className="bg-[#fbf7f4] py-16 md:py-24 border-y border-border/50 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column - Brand Narrative & Story */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="size-3.5" />
              <span>The Ferdous Craft</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground leading-[1.15] font-normal">
              Elegance Woven Into Every Thread
            </h2>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              At <strong className="text-foreground">Ferdous Textile</strong>, we specialize in luxury 3-piece (Three Piece) unstitched suits. Combining traditional Bangladeshi weaves with modern Pakistani lawn aesthetics, each collection brings you timeless style, vibrant hues, and delicate craftsmanship.
            </p>

            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-sm font-medium transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
              >
                <span>Explore Three Piece Edit</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Right Column - Feature Grid & Image Showcase */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {highlights.map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-border/60 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                >
                  <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
