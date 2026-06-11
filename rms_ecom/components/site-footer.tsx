"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react"
import { ecommerceApi } from "@/lib/api"

type Settings = Awaited<ReturnType<typeof ecommerceApi.getHomePageSettings>>

export function SiteFooter() {
  const [settings, setSettings] = useState<Settings>({})

  useEffect(() => {
    ecommerceApi.getHomePageSettings().then(setSettings).catch(() => undefined)
  }, [])

  return (
    <footer className="border-t border-border bg-white">
      <div className="container py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.2fr_.8fr_.8fr_1fr]">
          <div>
            <Link href="/" className="inline-block">
              {settings.logo_image_url ? (
                <span className="relative block h-10 w-36">
                  <Image src={settings.logo_image_url} alt={settings.logo_text || "Ferdous Textile"} fill className="object-contain object-left" />
                </span>
              ) : (
                <span className="font-serif text-2xl text-primary">{settings.logo_text || "FERDOUS TEXTILE"}</span>
              )}
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">
              {settings.footer_tagline || "Considered clothing, responsibly made for everyday life."}
            </p>
            <div className="mt-6 space-y-2 text-sm">
              {settings.footer_address ? <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{settings.footer_address}</p> : null}
              {settings.footer_phone ? <a className="flex gap-2" href={`tel:${settings.footer_phone}`}><Phone className="size-4" />{settings.footer_phone}</a> : null}
              {settings.footer_email ? <a className="flex gap-2" href={`mailto:${settings.footer_email}`}><Mail className="size-4" />{settings.footer_email}</a> : null}
            </div>
          </div>

          <FooterColumn title="Discover" links={[["All Products", "/products"], ["Women", "/women"], ["Men", "/men"], ["Unisex", "/unisex"]]} />
          <FooterColumn title="Customer Care" links={[["Shopping Bag", "/cart"], ["Checkout", "/checkout"], ["Delivery Information", "/checkout"], ["Product Guide", "/products"]]} />

          <div>
            <p className="editorial-kicker text-foreground">Newsletter</p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Join our journey of thoughtful design and new collections.</p>
            <div className="mt-7 flex border-b border-border pb-2">
              <input type="email" aria-label="Email address" placeholder="Email address" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              <button type="button" aria-label="Newsletter signup is coming soon" title="Newsletter signup is coming soon">
                <ArrowRight className="size-5 text-primary" />
              </button>
            </div>
            <div className="mt-8 flex gap-4">
              {settings.footer_facebook_url ? <Social href={settings.footer_facebook_url} label="Facebook"><Facebook /></Social> : null}
              {settings.footer_instagram_url ? <Social href={settings.footer_instagram_url} label="Instagram"><Instagram /></Social> : null}
              {settings.footer_twitter_url ? <Social href={settings.footer_twitter_url} label="Twitter"><Twitter /></Social> : null}
            </div>
          </div>
        </div>

        <div className="motif-divider mt-16" />
        <div className="mt-7 flex flex-col justify-between gap-3 text-[11px] text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.logo_text || "Ferdous Textile"}. All rights reserved.</p>
          <p>Crafted in Bangladesh</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <p className="editorial-kicker text-foreground">{title}</p>
      <div className="mt-5 space-y-3 text-sm text-muted-foreground">
        {links.map(([label, href]) => <Link key={href + label} href={href} className="block hover:text-primary">{label}</Link>)}
      </div>
    </div>
  )
}

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return <Link href={href} target="_blank" rel="noreferrer" aria-label={label} className="[&_svg]:size-4 [&_svg]:stroke-[1.5]">{children}</Link>
}
