/**
 * The contract every payment method implements.
 *
 * A production integration would put a real gateway behind the same interface
 * (an operator's collection API for mobile money, a card processor for cards);
 * the UI only ever talks to a PaymentProvider and never knows the difference.
 * In this demo every provider is simulated: nothing is sent anywhere.
 */

export type PaymentMethodId = "mtn-momo" | "orange-money" | "card"

/** What the person sees while a payment is under way. */
export type PaymentProgress =
  /** Mobile money: a request has gone to the phone and waits for the PIN. */
  | "awaiting-approval"
  /** Card: the details are being checked. */
  | "processing"

export interface PaymentRequest<Details> {
  /** In the layout's currency, e.g. 1300 for $1,300. */
  amount: number
  currency: string
  /** Links the payment to its sales record, e.g. the invoice number. */
  reference: string
  details: Details
}

export interface PaymentReceipt {
  method: PaymentMethodId
  /** The provider's own transaction id, as it would appear on a statement. */
  transactionId: string
  paidAt: string
}

export type FieldErrors<Details> = Partial<Record<keyof Details, string>>

export interface PaymentProvider<Details> {
  id: PaymentMethodId
  /** The method's name as shown to the person. */
  name: string
  /** Details to start the form with, e.g. the buyer's phone number for mobile money. */
  initialDetails(context: { phone: string }): Details
  /** Plain-language problems with the entered details; empty when they are fine. */
  validate(details: Details): FieldErrors<Details>
  /**
   * Takes the payment. Resolves with a receipt once it succeeds, reports what
   * is happening along the way, and rejects with an AbortError if cancelled.
   */
  pay(
    request: PaymentRequest<Details>,
    options: { onProgress: (progress: PaymentProgress) => void; signal: AbortSignal },
  ): Promise<PaymentReceipt>
}
