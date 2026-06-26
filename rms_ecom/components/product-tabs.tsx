"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ProductDetailsSection } from "@/components/product-details-section"

interface ProductTabsProps {
  description?: string
  materials: Array<{ name: string; percentage: string }>
  whoIsThisFor: Array<{ title: string; description: string }>
  features: Array<{ title: string; description: string }>
}

export function ProductTabs({ description, materials, whoIsThisFor, features }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState("details")

  const tabs = [{ id: "details", label: "Product Details" }]

  return (
    <div className="border-t border-b border-border">
      <div className="container">
        <div className="flex gap-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative py-5 text-base font-medium transition-colors md:py-6 md:text-lg",
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
            </button>
          ))}
        </div>

        <div className="py-8 md:py-12">{activeTab === "details" && (
          <ProductDetailsSection 
            description={description}
            materials={materials}
            whoIsThisFor={whoIsThisFor}
            features={features}
          />
        )}</div>
      </div>
    </div>
  )
}
