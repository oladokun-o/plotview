import { Spinner } from "@/components/ui/Spinner"
import { Button } from "@/components/ui/Button"
import type { PaymentProgress } from "@/lib/payments"

interface PaymentPendingProps {
  progress: PaymentProgress
  methodName: string
  amount: string
  phone: string
  onCancel: () => void
}

/**
 * While the payment is under way: what is happening, what the person should
 * do, and a way out. Announced politely to screen readers.
 */
export function PaymentPending({ progress, methodName, amount, phone, onCancel }: PaymentPendingProps) {
  const awaitingPhone = progress === "awaiting-approval"
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center px-2 py-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent-text">
        <Spinner size={30} />
      </span>
      <h4 className="mt-5 font-display text-xl text-primary">
        {awaitingPhone ? "Approve the payment on your phone" : "Confirming your payment"}
      </h4>
      <p className="mt-2 max-w-72 text-sm leading-relaxed text-secondary">
        {awaitingPhone
          ? `We sent a request for ${amount} to ${phone}. Open the ${methodName} prompt and enter your PIN to approve it.`
          : `Checking the card details for ${amount}. This takes a few seconds.`}
      </p>
      <Button variant="ghost" size="sm" onClick={onCancel} className="mt-5">
        Cancel payment
      </Button>
    </div>
  )
}
