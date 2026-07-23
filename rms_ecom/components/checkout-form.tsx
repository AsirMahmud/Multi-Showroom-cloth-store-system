"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCart, clearCart, getCheckoutItems, clearDirectCheckoutItems } from "@/lib/cart"
import { ecommerceApi } from "@/lib/api"
import { useCheckoutStore } from "@/hooks/useCheckoutStore"
import { useBdAddress } from "@/hooks/useBdAddress"
import { useLoading } from "@/hooks/useLoading"
import { CheckoutSummary } from "./checkout-summary"
import dhakaThanasData from "../dhaka_thanas_structure.json"

interface Place {
  name: string
  bn_name: string
}

interface Thana {
  name: string
  bn_name: string
  places: Place[]
}

interface CityCorporation {
  name: string
  name_bn?: string
  abbreviation: string
  thanas: Thana[]
}

export function CheckoutForm() {
  const router = useRouter()
  const [paymentMethod] = useState("cod")
  const [error, setError] = useState<string | null>(null)
  const { deliveryMethod, setDeliveryMethod } = useCheckoutStore()
  const { startLoading, stopLoading } = useLoading()
  const {
    divisions,
    districts,
    upazillas,
    unions,
    loading: bdLoading,
    loadingDistricts,
    loadingUpazillas,
    loadingUnions,
    error: bdError,
    unionError,
    selectedDivision,
    selectedDivisionId,
    selectedDistrict,
    selectedDistrictId,
    selectedUpazilla,
    selectedUpazillaId,
    setSelectedDivision,
    setSelectedDistrict,
    setSelectedUpazilla,
  } = useBdAddress()
  const [selectedUnion, setSelectedUnion] = useState<string>("")

  const checkoutPlaceholderClass = "placeholder:text-muted-foreground/70"

  // Dhaka address states
  const [selectedCityCorp, setSelectedCityCorp] = useState<string>("")
  const [selectedThana, setSelectedThana] = useState<string>("")
  const [selectedPlace, setSelectedPlace] = useState<string>("")

  const cityCorporations: CityCorporation[] = dhakaThanasData.city_corporations || []

  // Get available thanas based on selected city corporation
  const availableThanas = cityCorporations.find(cc => cc.name === selectedCityCorp)?.thanas || []

  // Get available places based on selected thana
  const availablePlaces: Place[] = availableThanas.find(t => t.name === selectedThana)?.places || []



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startLoading()
    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      const firstName = String(formData.get("firstName") || "").trim()
      const lastName = String(formData.get("lastName") || "").trim()
      const customer_name = `${firstName} ${lastName}`.trim()
      const customer_phone = String(formData.get("phone") || "").trim()
      const customer_email = String(formData.get("email") || "").trim()

      // Validate required fields
      if (!customer_name || customer_name.length === 0) {
        throw new Error("Customer name is required. Please fill in first name and last name.")
      }

      if (!customer_phone || customer_phone.length === 0) {
        throw new Error("Phone number is required.")
      }

      // Validate phone number format (Bangladeshi mobile regex)
      const bdPhoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/
      if (!bdPhoneRegex.test(customer_phone)) {
        throw new Error("Please enter a valid 11-digit Bangladeshi mobile number (e.g., 01712345678).")
      }

      // Check minimum buying count and minimum order total from homepage settings
      try {
        const homeSettings = await ecommerceApi.getHomePageSettings()
        const minCount = homeSettings.min_product_buying_count ?? 1
        const minVariants = homeSettings.min_unique_product_variants ?? 1
        const minAmount = Number(homeSettings.min_order_amount ?? 0)

        const checkoutItems = getCheckoutItems()
        const totalQty = checkoutItems.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0)
        
        const activeItems = checkoutItems.filter((item: any) => (Number(item.quantity) || 0) > 0)
        const uniqueVariantsCount = activeItems.length

        if (minCount > 1 && totalQty < minCount) {
          throw new Error(`Minimum product buying count requirement is ${minCount} item(s). Your selection has ${totalQty} item(s). Please add more items to proceed.`)
        }
        
        if (minVariants > 1 && uniqueVariantsCount < minVariants) {
          throw new Error(`Minimum unique product variants requirement is ${minVariants}. Your selection has ${uniqueVariantsCount} unique product variant(s). Please add more unique items to proceed.`)
        }

        const subtotal = checkoutItems.reduce((acc: number, item: any) => acc + ((Number(item.unit_price) || 0) * (Number(item.quantity) || 0)), 0)
        if (minAmount > 0 && subtotal < minAmount) {
          throw new Error(`Minimum order total requirement is ৳${minAmount.toFixed(2)}. Your selection subtotal is ৳${subtotal.toFixed(2)}.`)
        }
      } catch (err: any) {
        if (err.message && err.message.startsWith("Minimum")) {
          throw err
        }
      }

      // Build shipping address based on delivery method
      let shipping_address: any = {}

      if (deliveryMethod === 'inside') {
        if (!selectedCityCorp) {
          throw new Error("City Corporation is required.")
        }
        if (!selectedThana) {
          throw new Error("Thana is required.")
        }
        if (!selectedPlace) {
          throw new Error("Place is required.")
        }

        // Inside Dhaka address structure
        shipping_address = {
          city_corporation: selectedCityCorp,
          thana: selectedThana,
          place: selectedPlace,
          address: String(formData.get("address") || "").trim(),
        }
        if (!shipping_address.address) {
          throw new Error("Street / House Address is required.")
        }
      } else {
        if (!selectedDivision) {
          throw new Error("Division is required.")
        }
        if (!selectedDistrict) {
          throw new Error("District is required.")
        }
        if (!selectedUpazilla) {
          throw new Error("Upazila / Thana is required.")
        }
        // Only require Union if unions are available for this upazila
        if (unions.length > 0 && !selectedUnion) {
          throw new Error("Union is required.")
        }

        // Outside Dhaka address structure (both use division/district/upazila/union)
        shipping_address = {
          division: selectedDivision,
          district: selectedDistrict,
          upazila: selectedUpazilla,
          union: selectedUnion,
          address: String(formData.get("address") || "").trim(),
        }
        if (!shipping_address.address) {
          throw new Error("Street / House Address is required.")
        }
      }
      const notes = String(formData.get("notes") || "")

      const cartItems = getCheckoutItems()
      if (!cartItems.length) throw new Error("Your cart is empty.")

      // Fetch authoritative prices and delivery charges
      const pricingResponse = await ecommerceApi.priceCart(cartItems)

      // Helper function to extract numeric product ID (handles cases like "141/blue")
      const extractNumericProductId = (productId: string | number): number => {
        if (typeof productId === 'number') {
          return productId
        }
        if (typeof productId === 'string' && productId.includes('/')) {
          const parts = productId.split('/')
          return Number(parts[0]) || 0
        }
        return Number(productId) || 0
      }

      // Helper function to normalize variation values for matching
      const normalizeValue = (val: string | null | undefined) => {
        if (!val) return null
        return String(val).trim() || null
      }

      // Create a map of product info from pricing response
      const productInfoMap = new Map<number, { original_price: number | null; discount: number | null }>()
      if (pricingResponse.products) {
        pricingResponse.products.forEach((product) => {
          productInfoMap.set(product.id, {
            original_price: product.original_price ? Number(product.original_price) : null,
            discount: product.discount || null
          })
        })
      }

      const items = cartItems.map((it) => {
        const pid = extractNumericProductId(it.productId)

        // Find matching priced item from pricing response
        const itemColor = normalizeValue(it.variations?.color)
        const itemSize = normalizeValue(it.variations?.size)

        const pricedItem = pricingResponse.items?.find((pi) => {
          if (pi.productId !== pid) return false
          const piColor = normalizeValue(pi.variant?.color)
          const piSize = normalizeValue(pi.variant?.size)
          const colorMatch = (piColor === itemColor) || (!piColor && !itemColor)
          const sizeMatch = (piSize === itemSize) || (!piSize && !itemSize)
          return colorMatch && sizeMatch
        })

        if (!pricedItem) {
          throw new Error(`Pricing information not found for product ID: ${pid}`)
        }

        // Get product discount info
        const productInfo = productInfoMap.get(pid)
        const originalPrice = pricedItem.original_price ?? productInfo?.original_price
        // Calculate unit price and discount amount
        let unit_price = pricedItem.unit_price
        let discountAmount = 0

        // Use the authoritative rounded prices returned by cart pricing.
        if (originalPrice && originalPrice > pricedItem.unit_price) {
          // Backend expects: (quantity * unit_price) - discount = final total
          // So: unit_price should be original_price, discount = (original - discounted) * quantity
          unit_price = originalPrice
          discountAmount = (originalPrice - pricedItem.unit_price) * it.quantity
        } else {
          // No discount, use the unit_price from pricing response (already discounted if applicable)
          unit_price = pricedItem.unit_price
        }

        const size = it.variations?.size || ""
        const color = it.variations?.color || ""
        return {
          product_id: pid,
          combination_id: pricedItem.combination_id,
          size,
          color,
          quantity: it.quantity,
          unit_price,
          discount: discountAmount,
        }
      })

      // Get delivery charge based on selected method
      let deliveryCharge = 0
      let deliveryMethodName = ''
      if (deliveryMethod === 'inside') {
        deliveryCharge = Number(pricingResponse.delivery.inside_dhaka_charge)
        deliveryMethodName = 'Inside Dhaka'
      } else {
        deliveryCharge = Number(pricingResponse.delivery.outside_dhaka_charge)
        deliveryMethodName = 'Outside Dhaka'
      }

      // Final validation before sending
      if (!customer_name || customer_name.length === 0) {
        throw new Error("Customer name is required. Please fill in first name and last name.")
      }

      if (!customer_phone || customer_phone.length === 0) {
        throw new Error("Phone number is required.")
      }

      const payload = {
        customer_name,
        customer_phone,
        customer_email: customer_email || undefined, // Send undefined if empty, not empty string
        shipping_address,
        notes: notes || undefined,
        items,
        delivery_charge: deliveryCharge,
        delivery_method: deliveryMethodName,
      }

      console.log('Submitting payload:', { ...payload, items: items.length }) // Debug log
      const created = await ecommerceApi.createOnlinePreorder(payload)
      clearDirectCheckoutItems() // Clear direct checkout items first
      clearCart() // Also clear regular cart
      router.push(`/order-complete?preorder_id=${created.id}`)
    } catch (err: any) {
      setError(err?.message || "Failed to place order. Please try again.")
    } finally {
      stopLoading()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Ordering Instructions & Guidelines Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 md:p-5 text-foreground space-y-2">
        <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-sans text-xs font-bold">✓</span>
          Ordering Instructions & Notice
        </h3>
        <ul className="text-xs md:text-sm text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
          <li><strong>Minimum Requirement:</strong> Orders require at least <strong>3 unique product variants</strong> (or items) to place an order successfully.</li>
          <li><strong>100% Cash on Delivery:</strong> Pay conveniently when your parcel is delivered to your doorstep.</li>
          <li><strong>Phone Verification:</strong> Please ensure your phone number is correct. Our customer care representative will call you to confirm the order before shipment.</li>
          <li><strong>Delivery Coverage:</strong> Delivery within 2-3 business days inside Dhaka, and 3-5 business days outside Dhaka.</li>
        </ul>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Contact Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input id="firstName" name="firstName" placeholder="John" required className={checkoutPlaceholderClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input id="lastName" name="lastName" placeholder="Doe" required className={checkoutPlaceholderClass} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="john.doe@example.com"
            className={checkoutPlaceholderClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="01712345678"
            required
            className={checkoutPlaceholderClass}
          />
        </div>
      </div>

      {/* Shipping Address */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Shipping Address</h2>
        {/* Delivery Location Toggle */}
        <div className="flex flex-col sm:flex-row sm:justify-end pt-4">
          <div className="flex flex-col sm:inline-flex sm:flex-row rounded-lg border border-input bg-background p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setDeliveryMethod('inside')
                // Reset Dhaka address fields
                setSelectedCityCorp("")
                setSelectedThana("")
                setSelectedPlace("")
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${deliveryMethod === 'inside'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Inside Dhaka
            </button>
            <button
              type="button"
              onClick={() => {
                setDeliveryMethod('outside')
                // Reset outside Dhaka address fields
                setSelectedDivision("", "")
                setSelectedDistrict("", "")
                setSelectedUpazilla("", "")
                setSelectedUnion("")
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${deliveryMethod === 'outside'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Outside Dhaka
            </button>
          </div>
        </div>

        {/* Hidden inputs for form submission */}
        {deliveryMethod === 'inside' ? (
          <>
            <input type="hidden" name="cityCorp" value={selectedCityCorp} />
            <input type="hidden" name="thana" value={selectedThana} />
            <input type="hidden" name="place" value={selectedPlace} />
          </>
        ) : (
          <>
            <input type="hidden" name="division" value={selectedDivision} />
            <input type="hidden" name="district" value={selectedDistrict} />
            <input type="hidden" name="upazila" value={selectedUpazilla} />
            <input type="hidden" name="union" value={selectedUnion} />
          </>
        )}

        {deliveryMethod === 'inside' ? (
          /* Inside Dhaka Address Fields */
          <>
            {/* City Corporation */}
            <div className="space-y-2">
              <Label htmlFor="cityCorp">City Corporation *</Label>
              <Select
                value={selectedCityCorp}
                onValueChange={(value) => {
                  setSelectedCityCorp(value)
                  setSelectedThana("")
                  setSelectedPlace("")
                }}
                required
              >
                <SelectTrigger id="cityCorp">
                  <SelectValue placeholder="Select City Corporation" />
                </SelectTrigger>
                <SelectContent>
                  {cityCorporations.map((cc) => (
                    <SelectItem key={cc.name} value={cc.name}>
                      {cc.name} ({cc.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Thana */}
            <div className="space-y-2">
              <Label htmlFor="thana">Thana *</Label>
              <Select
                value={selectedThana}
                onValueChange={(value) => {
                  setSelectedThana(value)
                  setSelectedPlace("")
                }}
                disabled={!selectedCityCorp || availableThanas.length === 0}
                required
              >
                <SelectTrigger id="thana">
                  <SelectValue placeholder="Select Thana" />
                </SelectTrigger>
                <SelectContent>
                  {availableThanas.map((thana) => (
                    <SelectItem key={thana.name} value={thana.name}>
                      {thana.name} {thana.bn_name ? `(${thana.bn_name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Place */}
            <div className="space-y-2">
              <Label htmlFor="place">Place *</Label>
              <Select
                value={selectedPlace}
                onValueChange={setSelectedPlace}
                disabled={!selectedThana || availablePlaces.length === 0}
                required
              >
                <SelectTrigger id="place">
                  <SelectValue placeholder="Select Place" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlaces.map((place) => {
                    const placeName = typeof place === 'string' ? place : place.name
                    const placeBnName = typeof place === 'object' ? place.bn_name : undefined
                    return (
                      <SelectItem key={placeName} value={placeName}>
                        {placeName} {placeBnName ? `(${placeBnName})` : ""}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          /* Outside Dhaka Address Fields */
          <>
            {/* Division */}
            <div className="space-y-2">
              <Label htmlFor="division">Division *</Label>
              <Select
                value={selectedDivision}
                onValueChange={(value) => {
                  const division = divisions.find((d) => d.name === value || d.id.toString() === value)
                  if (division) {
                    setSelectedDivision(division.name, division.id)
                  }
                }}
                disabled={bdLoading}
                required
              >
                <SelectTrigger id="division" disabled={bdLoading}>
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((div) => (
                    <SelectItem key={div.id} value={div.name}>
                      {div.name} ({div.bn_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {bdError && !selectedDivision && (
                <p className="text-sm text-red-600">{bdError}</p>
              )}
            </div>

            {/* District */}
            <div className="space-y-2">
              <Label htmlFor="district">District *</Label>
              <Select
                value={selectedDistrict}
                onValueChange={(value) => {
                  const district = districts.find((d) => d.name === value || d.id.toString() === value)
                  if (district) {
                    setSelectedDistrict(district.name, district.id)
                  }
                }}
                disabled={!selectedDivision || loadingDistricts || districts.length === 0}
                required
              >
                <SelectTrigger id="district" disabled={!selectedDivision || loadingDistricts || districts.length === 0}>
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((dist) => (
                    <SelectItem key={dist.id} value={dist.name}>
                      {dist.name} {dist.bn_name ? `(${dist.bn_name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingDistricts && (
                <p className="text-sm text-muted-foreground">Loading districts...</p>
              )}
            </div>

            {/* Upazila/Thana */}
            <div className="space-y-2">
              <Label htmlFor="upazila">Upazila / Thana *</Label>
              <Select
                value={selectedUpazilla}
                onValueChange={(value) => {
                  const upazilla = upazillas.find((u) => u.name === value || u.id.toString() === value)
                  if (upazilla) {
                    setSelectedUpazilla(upazilla.name, upazilla.id)
                  }
                }}
                disabled={!selectedDistrict || loadingUpazillas || upazillas.length === 0}
                required
              >
                <SelectTrigger id="upazila">
                  <SelectValue placeholder="Select Upazila / Thana" />
                </SelectTrigger>
                <SelectContent>
                  {upazillas.map((upazilla) => (
                    <SelectItem key={upazilla.id} value={upazilla.name}>
                      {upazilla.name} {upazilla.bn_name ? `(${upazilla.bn_name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingUpazillas && (
                <p className="text-sm text-muted-foreground">Loading upazillas...</p>
              )}
            </div>

            {/* Union */}
            <div className="space-y-2">
              <Label htmlFor="union">Union {unions.length > 0 && "*"}</Label>
              <Select
                value={selectedUnion}
                onValueChange={setSelectedUnion}
                disabled={!selectedUpazilla || loadingUnions || unions.length === 0}
                required={unions.length > 0}
              >
                <SelectTrigger id="union">
                  <SelectValue placeholder="Select Union" />
                </SelectTrigger>
                <SelectContent>
                  {unions.map((union) => (
                    <SelectItem key={union.id} value={union.name}>
                      {union.name} {union.bn_name ? `(${union.bn_name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingUnions && (
                <p className="text-sm text-muted-foreground">Loading unions...</p>
              )}
              {unionError && !loadingUnions && (
                <p className="text-sm text-red-600">{unionError}</p>
              )}
              {!loadingUnions && unions.length === 0 && selectedUpazilla && !unionError && (
                <p className="text-sm text-muted-foreground">No unions available for this upazilla</p>
              )}
            </div>
          </>
        )}

        {/* Actual Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Street / House Address *</Label>
          <Textarea
            id="address"
            name="address"
            placeholder={deliveryMethod === 'inside' ? "House No, Road No, Block, Building, etc." : "House No, Road No, Area, etc."}
            rows={3}
            required
            className={checkoutPlaceholderClass}
          />
        </div>


      </div>

      {/* Payment Method (COD-only) */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Payment Method</h2>
        <div className="flex items-center space-x-3 border rounded-lg p-4 bg-muted/30">
          <RadioGroup value="cod" className="space-y-3" disabled>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="cod" id="cod" />
              <Label htmlFor="cod" className="cursor-pointer flex-1 font-medium">
                Cash on Delivery (Pay at delivery)
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Order Notes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Order Notes (Optional)</h2>
        <Textarea
          name="notes"
          placeholder="Add any special instructions for your order..."
          rows={4}
          className={checkoutPlaceholderClass}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Mobile-only Order Summary */}
      <div className="lg:hidden">
        <CheckoutSummary className="border rounded-lg p-6 bg-card" />
      </div>

      {/* Submit Button */}
      <Button type="submit" size="lg" className="w-full h-12 text-base">
        Place Order
      </Button>
    </form>
  )
}
