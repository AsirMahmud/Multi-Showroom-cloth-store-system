
import type React from "react"
import type { Metadata } from "next"
import { Hanken_Grotesk, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "./globals.css"
import { Suspense } from "react"
import { DiscountInitializer } from "@/components/discount-initializer"
import { LoadingProvider } from "@/contexts/loading-context"
import { Toaster } from "sonner"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { PromotionalModal } from "@/components/promotional-modal"

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'),
  title: {
    default: "Fashion Store - Premium Clothing",
    template: "%s | Fashion Store"
  },
  description: "Discover the latest trends in premium fashion and clothing. Shop quality apparel with style and confidence.",
  keywords: ["fashion", "clothing", "apparel", "men's fashion", "women's fashion", "online shopping", "premium clothing"],
  authors: [{ name: "Asir Mahmud" }],
  creator: "Fashion Store",
  publisher: "Fashion Store",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
    siteName: "Fashion Store",
    title: "Fashion Store - Premium Clothing",
    description: "Discover the latest trends in premium fashion and clothing.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fashion Store - Premium Clothing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fashion Store - Premium Clothing",
    description: "Discover the latest trends in premium fashion and clothing.",
    images: ["/og-image.jpg"],
    creator: "@fashionstore",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
  },
  category: "fashion",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${hanken.variable} ${playfair.variable} antialiased`} suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground">
        <LoadingProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              className: "bg-primary text-primary-foreground border-none shadow-lg",
            }}
          />
          <DiscountInitializer />
          <WhatsAppButton />
          <PromotionalModal />
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
        </LoadingProvider>
      </body>
    </html>
  )
}
