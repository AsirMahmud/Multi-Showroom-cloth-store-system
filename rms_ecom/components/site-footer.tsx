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
    <footer className="border-t border-border bg-white w-full overflow-hidden">
      <div className="container py-12 md:py-24 max-w-full">
        <div className="grid gap-8 sm:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_.8fr_.8fr_1fr] w-full min-w-0">
          <div className="min-w-0">
            <Link href="/" className="inline-block max-w-full">
              {settings.logo_image_url ? (
                <span className="relative block h-10 w-36 max-w-full">
                  <Image src={settings.logo_image_url} alt={settings.logo_text || "Ferdous Textile"} fill className="object-contain object-left" />
                </span>
              ) : (
                <span className="font-serif text-2xl text-primary break-words">{settings.logo_text || "FERDOUS TEXTILE"}</span>
              )}
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground break-words">
              {settings.footer_tagline || "Considered clothing, responsibly made for everyday life."}
            </p>
            <div className="mt-6 space-y-2 text-sm max-w-full">
              <p className="flex gap-2 min-w-0 break-words"><MapPin className="mt-0.5 size-4 shrink-0" /><span className="min-w-0 flex-1 break-words">{settings.footer_address || "সুরুজ মনোয়ারা শপিং কমপ্লেক্সের দোতালায়, বান্টি বাজার, আড়াইহাজার, নারায়ণগঞ্জ"}</span></p>
              <a className="flex gap-2 min-w-0 break-all" href={`tel:${settings.footer_phone || "01896285447"}`}><Phone className="size-4 shrink-0 mt-0.5" /><span className="min-w-0 flex-1 break-all">{settings.footer_phone || "01896285447"}</span></a>
              {settings.footer_email ? <a className="flex gap-2 min-w-0 break-all" href={`mailto:${settings.footer_email}`}><Mail className="size-4 shrink-0 mt-0.5" /><span className="min-w-0 flex-1 break-all">{settings.footer_email}</span></a> : null}
            </div>
          </div>

          <FooterColumn title="Discover" links={[["All Products", "/products"], ["Women", "/women"], ["Men", "/men"], ["Unisex", "/unisex"]]} />
          <FooterColumn title="Customer Care" links={[["Shopping Bag", "/cart"], ["Checkout", "/checkout"], ["Delivery Information", "/checkout"], ["Product Guide", "/products"]]} />

          <div className="min-w-0">
            <p className="editorial-kicker text-foreground">Connect with us</p>
            <div className="mt-5 flex flex-wrap gap-4">
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
