import { Package, Shield, CreditCard, Headphones } from "lucide-react"

const features = [
  {
    icon: Package,
    title: "Fast Shipping",
    description: "2-3 days fast delivery",
  },
 
  {
    icon: CreditCard,
    title: "Money Back",
    description: "3 days money back guarantee",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated support team ready to help",
  },
]

export function FeaturesSection() {
  return (
    <section className="w-full bg-muted/60 py-16">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="border-l border-border pl-6">
                <div className="mb-5">
                  <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-serif text-xl">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
