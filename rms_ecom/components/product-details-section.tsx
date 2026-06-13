"use client"

import { Package, Users, Shirt } from "lucide-react"

interface ProductDetailsSectionProps {
  description?: string
  materials?: Array<{ name: string; percentage: string }>
  whoIsThisFor?: Array<{ title: string; description: string }>
  features?: Array<{ title: string; description: string }>
}

export function ProductDetailsSection({ description, materials, whoIsThisFor, features }: ProductDetailsSectionProps) {
  const materialsData = materials || []
  const whoIsThisForData = whoIsThisFor || []
  const featuresData = features || []
  return (
    <div className="grid gap-8 lg:gap-12">
      {/* Product Description Section */}
      {description && (
        <div>
          <h2 className="text-xl lg:text-2xl font-bold mb-4">Description</h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>
        </div>
      )}

      {/* Material Composition Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-muted p-2">
            <Shirt className="h-5 w-5" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold">Material Composition</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {materialsData.map((material) => (
            <div key={material.name} className="rounded-2xl border border-border p-6">
              <div className="text-3xl font-bold mb-2">{material.percentage}</div>
              <div className="text-muted-foreground">{material.name}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-muted p-6">
          <h3 className="font-semibold mb-3 text-sm lg:text-base">Care Instructions</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Machine wash cold with similar colors</li>
            <li>• Do not bleach</li>
            <li>• Tumble dry low</li>
            <li>• Iron on low heat if needed</li>
            <li>• Do not dry clean</li>
          </ul>
        </div>
      </div>

      {/* Fit Information Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-muted p-2">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold">Who Is This For?</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {whoIsThisForData.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-border p-6">
              <h3 className="font-semibold mb-3 text-base lg:text-lg">{item.title}</h3>
              <p className="text-muted-foreground text-sm lg:text-base leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-muted p-2">
            <Package className="h-5 w-5" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold">Product Features</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuresData.map((feature, idx) => (
            <div key={idx} className="rounded-2xl bg-muted p-6">
              <h3 className="font-semibold mb-2 text-sm lg:text-base">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
