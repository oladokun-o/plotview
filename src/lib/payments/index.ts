import { cardProvider } from "./card"
import { createMobileMoneyProvider } from "./mobileMoney"
import type { PaymentMethodId } from "./types"

export const mtnMoMoProvider = createMobileMoneyProvider({ id: "mtn-momo", name: "MTN MoMo", transactionPrefix: "MP" })
export const orangeMoneyProvider = createMobileMoneyProvider({ id: "orange-money", name: "Orange Money", transactionPrefix: "OM" })
export { cardProvider }

/** Payment methods in the order they are offered. */
export const PAYMENT_METHODS: readonly PaymentMethodId[] = ["mtn-momo", "orange-money", "card"]

export const PAYMENT_METHOD_NAME: Record<PaymentMethodId, string> = {
  "mtn-momo": mtnMoMoProvider.name,
  "orange-money": orangeMoneyProvider.name,
  card: cardProvider.name,
}

export type { PaymentMethodId, PaymentProgress, PaymentReceipt, PaymentProvider } from "./types"
