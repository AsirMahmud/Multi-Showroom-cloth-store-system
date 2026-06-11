import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail } from "lucide-react"

export function NewsletterSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container">
        <div className="border border-border bg-[#f4f3f4] p-8 md:p-14">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-balance">
              Notes from the studio
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="h-12 bg-white pl-10 text-foreground"
                />
              </div>
              <Button
                size="lg"
                variant="secondary"
                className="h-12 bg-primary px-8 text-white hover:bg-[#842500]"
              >
                Subscribe to Newsletter
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
