import { SiteHeader } from "@/components/site-header"
import { Breadcrumb } from "@/components/breadcrumb"
import { CartItems } from "@/components/cart-items"
import { CartSummary } from "@/components/cart-summary"
import { SiteFooter } from "@/components/site-footer"
import { CheckoutProgress } from "@/components/checkout-progress"

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-10 md:py-16">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Cart", href: "/cart" },
            ]}
          />

          <div className="mb-12 mt-8 text-center">
            <p className="editorial-kicker">Your selection</p>
            <h1 className="mb-7 mt-2 font-serif text-4xl md:text-5xl">Shopping bag</h1>
            <CheckoutProgress currentStep={1} />
          </div>

          <div className="mt-8 grid gap-12 lg:grid-cols-3">
            {/* Cart Items - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <CartItems />
            </div>

            {/* Cart Summary - Takes 1 column on large screens */}
            <div className="lg:col-span-1">
              <CartSummary />
            </div>
          </div>
        </div>

      </main>

      <SiteFooter />
    </div>
  )
}
