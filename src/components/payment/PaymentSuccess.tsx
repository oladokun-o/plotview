"use client"

import { Check } from "lucide-react"
import { useFocusOnMount } from "@/lib/useFocusOnMount"

interface PaymentSuccessProps {
  amount: string
  methodName: string
}

/** A calm acknowledgement that the money arrived. */
export function PaymentSuccess({ amount, methodName }: PaymentSuccessProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center px-2 py-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-accent text-on-accent">
        <Check aria-hidden="true" className="size-8" strokeWidth={2.25} />
      </span>
      <h3 ref={headingRef} tabIndex={-1} className="mt-5 font-display text-xl text-primary outline-none">
        Payment received
      </h3>
      <p className="mt-2 max-w-72 text-sm leading-relaxed text-secondary">
        {amount} paid with {methodName}. Thank you.
      </p>
    </div>
  )
}
