"use client"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useMemo, useEffect, useState } from "react"
import Link from "next/link"
import { useCartStore } from "@/hooks/useCartStore"
import { ecommerceApi, EcommerceProduct } from "@/lib/api"
import { useLoading } from "@/hooks/useLoading"
import { sendGTMEvent, normalizeProductId } from "@/lib/gtm"
import { normalizeCartLine } from "@/lib/utils"
import { useCheckoutStore } from "@/hooks/useCheckoutStore"

interface CartPricing {
  subtotal: number
  delivery: {
    inside_dhaka_charge: number
    inside_gazipur_charge: number
    outside_dhaka_charge: number
    updated_at: string
  }
  items: Array<{
    productId: number;
    name: string;
    unit_price: number;
    quantity: number;
    variant?: { color?: string | null; size?: string | null };
  }>
  products: EcommerceProduct[]
}

export function CartSummary() {
  const items = useCartStore((s) => s.items)
  const shippingMethod = useCheckoutStore((state) => state.deliveryMethod)
  const setShippingMethod = useCheckoutStore((state) => state.setDeliveryMethod)
  const [cartPricing, setCartPricing] = useState<CartPricing | null>(null)
  const [homeSettings, setHomeSettings] = useState<{ min_product_buying_count?: number; min_unique_product_variants?: number; min_order_amount?: number } | null>(null)
  const [localLoading, setLocalLoading] = useState(false)
  const { startLoading, stopLoading } = useLoading()

  const itemCount = useMemo(() => items.reduce((n, it) => n + it.quantity, 0), [items])

  useEffect(() => {
    ecommerceApi.getHomePageSettings().then(setHomeSettings).catch(() => null)
  }, [])

  useEffect(() => {
    const fetchCartPricing = async () => {
      if (items.length === 0) {
        setCartPricing(null)
        return
      }

      try {
        startLoading()
        setLocalLoading(true)

        // Normalize items: extract numeric productId and ensure variations are properly set
        const normalizedItems = items.map(normalizeCartLine)

        const response = await ecommerceApi.priceCart(normalizedItems)
        // Convert all values to numbers to ensure proper type handling
        // Note: subtotal from backend is already discounted (sum of final prices)
        setCartPricing({
          subtotal: Number(response.subtotal) || 0,
          delivery: {
            inside_dhaka_charge: Number(response.delivery.inside_dhaka_charge) || 0,
            inside_gazipur_charge: Number(response.delivery.inside_gazipur_charge) || 0,
            outside_dhaka_charge: Number(response.delivery.outside_dhaka_charge) || 0,
            updated_at: response.delivery.updated_at || ""
          },
          items: response.items,
          products: (response.products || []) as unknown as EcommerceProduct[]
        })
      } catch (error) {
        console.error("Failed to fetch cart pricing:", error)
      } finally {
        stopLoading()
        setLocalLoading(false)
      }
    }

    fetchCartPricing()
  }, [items])

  // Helper function to safely format numbers
  const formatPrice = (value: number | string | null | undefined): string => {
    const num = Number(value)
    if (isNaN(num)) return "0.00"
    return num.toFixed(2)
  }

  const subtotal = Number(cartPricing?.subtotal) || 0

  // Calculate discount - unit_price is already discounted, so we need to calculate
  // the difference between original price and discounted price
  const discountTotal = useMemo(() => {
    if (!cartPricing?.items || !cartPricing?.products) return 0

    return cartPricing.items.reduce((total, item) => {
      const product = cartPricing.products.find(p => p.id === item.productId)
      if (!product) return total

      // Get original price (use original_price if available, otherwise selling_price)
      const originalPrice = product.original_price 
        ? Number(product.original_price) 
        : Number(product.selling_price) || 0
      
      // unit_price is already the discounted/final price
      const discountedPrice = item.unit_price
      
      // Calculate discount amount: (original - discounted) * quantity
      if (originalPrice > discountedPrice) {
        const discountAmount = (originalPrice - discountedPrice) * item.quantity
        return total + discountAmount
      }
      
      return total
    }, 0)
  }, [cartPricing])

  let deliveryCharge = 0
  if (shippingMethod === 'outside') {
    deliveryCharge = Number(cartPricing?.delivery?.outside_dhaka_charge) || 0
  } else if (shippingMethod === 'inside') {
    deliveryCharge = Number(cartPricing?.delivery?.inside_dhaka_charge) || 0
  }

  // subtotal is already discounted from backend
  const total = subtotal + deliveryCharge

  const handleCheckout = () => {
    if (!items.length || !cartPricing) return

    // GA4 begin_checkout - GTM triggers Facebook Pixel InitiateCheckout
    sendGTMEvent('begin_checkout', {
      currency: 'BDT',
      value: total,
      items: cartPricing.items.map(i => {
        const colorSlug = (i.variant?.color || '').toLowerCase().replace(/\s+/g, '-');
        return {
          item_id: colorSlug ? `${i.productId}-${colorSlug}` : String(i.productId),
          item_name: i.name,
          price: i.unit_price,
          quantity: i.quantity,
          item_variant: `${i.variant?.color || ''} ${i.variant?.size || ''}`.trim()
        };
      })
    })
  }

  if (items.length === 0) {
    return (
      <div className="editorial-surface p-6">
        <p className="editorial-kicker">Your order</p>
        <h2 className="mb-6 mt-2 font-serif text-2xl">Cart summary</h2>
        <p className="text-center text-muted-foreground py-8">Your cart is empty.</p>
      </div>
    )
  }

  return (
    <div className="editorial-surface p-6">
      <p className="editorial-kicker">Your order</p>
      <h2 className="mb-6 mt-2 font-serif text-2xl">Cart summary</h2>

      {/* Delivery Options */}
      <div className="mb-6">
        <Label className="text-base font-semibold mb-3 block">Delivery Method</Label>
        <RadioGroup value={shippingMethod} onValueChange={(value) => setShippingMethod(value as 'inside' | 'outside')} className="space-y-3">
          <div className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <RadioGroupItem value="inside" id="inside" />
              <Label htmlFor="inside" className="cursor-pointer font-medium">
                Inside Dhaka
              </Label>
            </div>
            {localLoading ? (
              <span className="font-semibold text-muted-foreground">—</span>
            ) : (
              <span className="font-semibold">৳{formatPrice(cartPricing?.delivery?.inside_dhaka_charge)}</span>
            )}
          </div>

          <div className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <RadioGroupItem value="outside" id="outside" />
              <Label htmlFor="outside" className="cursor-pointer font-medium">
                Outside Dhaka
              </Label>
            </div>
            {localLoading ? (
              <span className="font-semibold text-muted-foreground">—</span>
            ) : (
              <span className="font-semibold">৳{formatPrice(cartPricing?.delivery?.outside_dhaka_charge)}</span>
            )}
          </div>
        </RadioGroup>
      </div>

      {/* Price Summary */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex justify-between text-base">
          <span className="text-muted-foreground">Subtotal</span>
          {localLoading ? (
            <span className="font-semibold text-muted-foreground">—</span>
          ) : (
            <span className="font-semibold">৳{formatPrice(subtotal)}</span>
          )}
        </div>

        {discountTotal > 0 && (
          <div className="flex justify-between text-base text-red-600">
            <span className="font-medium">Discount</span>
            {localLoading ? (
              <span className="font-semibold text-muted-foreground">—</span>
            ) : (
              <span className="font-semibold">-৳{formatPrice(discountTotal)}</span>
            )}
          </div>
        )}

        <div className="flex justify-between text-base">
          <span className="text-muted-foreground">Delivery</span>
          {localLoading ? (
            <span className="font-semibold text-muted-foreground">—</span>
          ) : (
            <span className="font-semibold">৳{formatPrice(deliveryCharge)}</span>
          )}
        </div>

        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Total</span>
          {localLoading ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span>৳{formatPrice(total)}</span>
          )}
        </div>
      </div>

      {/* Purchase Limits Warning & Ordering Instructions */}
      {(() => {
        const minCount = homeSettings?.min_product_buying_count ?? 1
        const minVariants = homeSettings?.min_unique_product_variants ?? 1
        const minAmount = Number(homeSettings?.min_order_amount ?? 0)
        
        // Items is an array of variants. So unique variants is just items.length where quantity > 0
        const activeItems = items.filter(item => item.quantity > 0)
        const uniqueVariantsCount = activeItems.length

        const isBelowMinCount = itemCount < minCount
        const isBelowMinVariants = uniqueVariantsCount < minVariants
        const isBelowMinAmount = minAmount > 0 && subtotal < minAmount

        return (
          <div className="mt-4 space-y-3">
            {/* General Ordering Instructions */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-800 text-xs space-y-1.5">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <span>📋</span> Ordering Guidelines:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
                <li>Minimum order requires at least <strong className="text-slate-800">{minVariants} unique product variant(s)</strong>.</li>
                <li>Full Cash on Delivery (COD) across all districts in Bangladesh.</li>
                <li>Phone confirmation call is required before order delivery.</li>
              </ul>
            </div>

            {/* Warning block if minimum requirements not met */}
            {(isBelowMinCount || isBelowMinVariants || isBelowMinAmount) && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                {isBelowMinCount && (
                  <p className="font-semibold">
                    ⚠️ Minimum product count requirement is {minCount} item(s). Please add {minCount - itemCount} more item(s) to proceed.
                  </p>
                )}
                {isBelowMinVariants && (
                  <p className="font-semibold">
                    ⚠️ Minimum unique product variants requirement is {minVariants}. You currently have {uniqueVariantsCount}. Please add {minVariants - uniqueVariantsCount} more unique product variant(s) to checkout.
                  </p>
                )}
                {isBelowMinAmount && (
                  <p className="font-semibold">
                    ⚠️ Minimum order amount requirement is ৳{minAmount.toFixed(2)}. Your current subtotal is ৳{subtotal.toFixed(2)}.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* Checkout Button */}
      {(() => {
        const minCount = homeSettings?.min_product_buying_count ?? 1
        const minVariants = homeSettings?.min_unique_product_variants ?? 1
        const minAmount = Number(homeSettings?.min_order_amount ?? 0)
        
        const activeItems = items.filter(item => item.quantity > 0)
        const uniqueVariantsCount = activeItems.length

        const isBelowMinCount = itemCount < minCount
        const isBelowMinVariants = uniqueVariantsCount < minVariants
        const isBelowMinAmount = minAmount > 0 && subtotal < minAmount
        
        const isDisabled = localLoading || items.length === 0 || isBelowMinCount || isBelowMinVariants || isBelowMinAmount

        return (
          <Link href={isDisabled ? "#" : "/checkout"} tabIndex={isDisabled ? -1 : 0}>
            <Button
              size="lg"
              className="w-full mt-6 h-12 text-base"
              disabled={isDisabled}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault()
                  return
                }
                handleCheckout()
              }}
            >
              Checkout
            </Button>
          </Link>
        )
      })()}
    </div>
  )
}
