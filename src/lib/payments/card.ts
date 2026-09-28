import { simulatedDelay, simulatedTransactionId } from "./simulate"
import type { FieldErrors, PaymentProvider } from "./types"

export interface CardDetails {
  number: string
  /** As typed, MM / YY. */
  expiry: string
  cvc: string
  name: string
}

const PROCESSING_MS = 1800

function digitsOf(value: string): string {
  return value.replace(/\D/g, "")
}

/** Groups a card number in fours as it is typed: 1234 5678 9012 3456. */
export function formatCardNumber(value: string): string {
  return digitsOf(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ")
}

/** Inserts the slash in an expiry date as it is typed: 07 / 29. */
export function formatExpiry(value: string): string {
  const digits = digitsOf(value).slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits
}

/**
 * Cards: number, expiry, security code and name. The demo accepts any
 * well-formed details and never stores or transmits them; they live only in
 * the form while it is on screen.
 */
export const cardProvider: PaymentProvider<CardDetails> = {
  id: "card",
  name: "Card",
  initialDetails: () => ({ number: "", expiry: "", cvc: "", name: "" }),
  validate(details) {
    const errors: FieldErrors<CardDetails> = {}
    const number = digitsOf(details.number)
    if (number.length < 12 || number.length > 19) {
      errors.number = "Enter the long number on the front of your card."
    }
    const [month, year] = details.expiry.split("/").map((part) => Number(part.trim()))
    const now = new Date()
    const expiresAfter = new Date(2000 + year, month) // first day of the month after expiry
    if (!month || month > 12 || !year || details.expiry.split("/")[1]?.trim().length !== 2) {
      errors.expiry = "Enter the expiry date as MM / YY."
    } else if (expiresAfter <= now) {
      errors.expiry = "This card has expired."
    }
    if (!/^\d{3,4}$/.test(details.cvc.trim())) {
      errors.cvc = "Enter the 3 or 4 digits on the back of your card."
    }
    if (details.name.trim().length < 2) {
      errors.name = "Enter the name as it appears on the card."
    }
    return errors
  },
  async pay(_request, { onProgress, signal }) {
    onProgress("processing")
    await simulatedDelay(PROCESSING_MS, signal)
    return { method: "card", transactionId: simulatedTransactionId("CD"), paidAt: new Date().toISOString() }
  },
}
