import { Info } from "lucide-react"

/** Always visible on the payment step: nothing here takes real money. */
export function DemoPaymentNote() {
  return (
    <p className="flex items-start gap-2 rounded-md bg-accent-soft px-3 py-2.5 text-sm text-primary ring-1 ring-inset ring-line-subtle">
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-text" />
      <span>
        <span className="font-medium">Demo:</span> no real payment is processed.
      </span>
    </p>
  )
}
