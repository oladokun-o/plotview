import { simulatedDelay, simulatedTransactionId } from "./simulate"
import type { PaymentMethodId, PaymentProvider } from "./types"

export interface MobileMoneyDetails {
  phone: string
}

interface MobileMoneyOptions {
  id: Extract<PaymentMethodId, "mtn-momo" | "orange-money">
  name: string
  transactionPrefix: string
}

/** How long the simulated operator takes to confirm after the request reaches the phone. */
const APPROVAL_MS = 4000

/**
 * Mobile money: the buyer enters the number of their wallet, the operator sends
 * a prompt to that phone, and the payment completes once they approve it with
 * their PIN. MTN MoMo and Orange Money work the same way from the buyer's side,
 * so both are built from this one implementation.
 */
export function createMobileMoneyProvider({
  id,
  name,
  transactionPrefix,
}: MobileMoneyOptions): PaymentProvider<MobileMoneyDetails> {
  return {
    id,
    name,
    initialDetails: ({ phone }) => ({ phone }),
    validate({ phone }) {
      const digits = phone.replace(/[^\d]/g, "")
      if (!/^\+?[\d\s().-]+$/.test(phone.trim()) || digits.length < 8 || digits.length > 15) {
        return { phone: `Enter the phone number of your ${name} account.` }
      }
      return {}
    },
    async pay(_request, { onProgress, signal }) {
      onProgress("awaiting-approval")
      await simulatedDelay(APPROVAL_MS, signal)
      return { method: id, transactionId: simulatedTransactionId(transactionPrefix), paidAt: new Date().toISOString() }
    },
  }
}
