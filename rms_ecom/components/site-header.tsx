"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react"
import { ecommerceApi, type ProductByColorEntry } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { useCartStore } from "@/hooks/useCartStore"
import { cn } from "@/lib/utils"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

type Category = {
  id: number
  name: string
  slug: string
  parent: number | null
}

const primaryLinks = [
  { href: "/products", label: "All Products" },
  { href: "/women", label: "Women" },
  { href: "/men", label: "Men" },
  { href: "/unisex", label: "Unisex" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const totalItems = useCartStore((state) => state.totalItems)
  const [branding, setBranding] = useState<{ logo_image_url?: string; logo_text?: string }>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ProductByColorEntry[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([
      ecommerceApi.getHomePageSettings(),
      ecommerceApi.getOnlineCategories({}),
    ]).then(([settings, categoryData]) => {
      setBranding(settings)
      setCategories(categoryData.filter((category) => !category.parent).slice(0, 6))
    }).catch(() => undefined)
  }, [])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const search = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const response = await ecommerceApi.getProductsByColorPaginated({
          search: value.trim(),
          only_in_stock: true,
          page_size: 8,
        })
        setResults(response.results)
      } finally {
        setSearching(false)
      }
    }, 250)
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="container flex h-[72px] items-center justify-between gap-6 md:h-[88px]">
          <Link href="/" aria-label="Ferdous Textile home" className="min-w-fit">
            {branding.logo_image_url ? (
              <span className="relative block h-10 w-36">
                <Image src={branding.logo_image_url} alt={branding.logo_text || "Ferdous Textile"} fill priority className="object-contain object-left" />
              </span>
            ) : (
              <span className="font-serif text-2xl font-semibold tracking-[-0.03em] text-primary md:text-3xl">
                {branding.logo_text || "FERDOUS TEXTILE"}
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "border-b py-2 text-xs font-medium uppercase tracking-[0.12em] transition-colors",
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "border-primary text-primary"
                    : "border-transparent hover:border-foreground/40",
                )}
              >
                {link.label}
              </Link>
            ))}
            {categories.slice(0, 2).map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`} className="border-b border-transparent py-2 text-xs font-medium uppercase tracking-[0.12em] hover:border-foreground/40">
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} className="grid size-10 place-items-center" aria-label="Search products">
              <Search className="size-[19px]" strokeWidth={1.5} />
            </button>
            <Link href="/cart" className="relative grid size-10 place-items-center" aria-label={`Shopping bag with ${totalItems} items`}>
              <ShoppingBag className="size-[19px]" strokeWidth={1.5} />
              {totalItems > 0 ? (
                <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] text-white">
                  {totalItems}
                </span>
              ) : null}
            </Link>
            <span className="hidden size-10 place-items-center md:grid" aria-hidden="true">
              <UserRound className="size-[19px]" strokeWidth={1.5} />
            </span>
            <button onClick={() => setMobileOpen((open) => !open)} className="grid size-10 place-items-center lg:hidden" aria-label="Toggle menu" aria-expanded={mobileOpen}>
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <nav className="border-t border-border bg-background px-5 py-6 lg:hidden" aria-label="Mobile navigation">
            <div className="grid gap-1">
              {[...primaryLinks, ...categories.map((category) => ({ href: `/category/${category.slug}`, label: category.name }))].map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="border-b border-border/60 py-4 text-sm font-medium uppercase tracking-[0.12em]">
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} title="Search products" description="Search the Ferdous Textile catalogue">
        <CommandInput value={query} onValueChange={search} placeholder="Search by product name..." />
        <CommandList>
          {searching ? <CommandEmpty>Searching...</CommandEmpty> : null}
          {!searching && query.length >= 2 && results.length === 0 ? <CommandEmpty>No products found.</CommandEmpty> : null}
          <CommandGroup heading="Products">
            {results.map((product) => (
              <CommandItem
                key={product.combination_id}
                value={`${product.product_name} ${product.color_name}`}
                onSelect={() => {
                  setSearchOpen(false)
                  router.push(product.product_url)
                }}
              >
                <div className="flex w-full items-center gap-4">
                  <div className="relative size-14 overflow-hidden bg-muted">
                    <Image src={product.cover_image_url || "/placeholder.jpg"} alt="" fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-base">{product.product_name}</p>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">{product.color_name}</p>
                  </div>
                  <span className="text-sm">{formatCurrency(product.discount_info?.final_price ?? product.product_price)}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
