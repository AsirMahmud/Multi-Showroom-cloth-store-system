interface CheckoutProgressProps {
  currentStep: 1 | 2 | 3
}

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  const steps = [
    { number: 1, label: "Shopping cart" },
    { number: 2, label: "Checkout details" },
    { number: 3, label: "Order complete" },
  ]

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-8 max-w-full mx-auto px-2 overflow-hidden">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center gap-2 sm:gap-4 md:gap-8">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Step Circle */}
            <div
              className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-semibold text-xs sm:text-sm transition-colors shrink-0 ${
                step.number === currentStep
                  ? "bg-foreground text-background"
                  : step.number < currentStep
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step.number}
            </div>

            {/* Step Label */}
            <span
              className={`text-xs sm:text-sm md:text-base font-medium hidden sm:inline ${
                step.number === currentStep ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className={`h-0.5 w-6 sm:w-12 md:w-20 shrink ${step.number < currentStep ? "bg-foreground" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  )
}
