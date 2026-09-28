"use client"

import { useEffect, useRef, useState } from "react"
import { CardForm } from "@/components/payment/CardForm"
import { DemoPaymentNote } from "@/components/payment/DemoPaymentNote"
import { MobileMoneyForm } from "@/components/payment/MobileMoneyForm"
import { PaymentMethodPicker } from "@/components/payment/PaymentMethodPicker"
import { PaymentPending } from "@/components/payment/PaymentPending"
import { PaymentSuccess } from "@/components/payment/PaymentSuccess"
import { formatPrice } from "@/lib/format"
import { PAYMENT_METHOD_NAME, cardProvider, mtnMoMoProvider, orangeMoneyProvider, type PaymentProgress } from "@/lib/payments"
import type { CardDetails } from "@/lib/payments/card"
import type { MobileMoneyDetails } from "@/lib/payments/mobileMoney"
import type { FieldErrors, PaymentReceipt } from "@/lib/payments/types"
import { appActions, type Reservation } from "@/lib/store"
import { StepHeading } from "./StepHeading"
import { STEP_TITLE } from "./steps"

export type PaymentStatus = "idle" | "pending" | "paid"

const SUCCESS_PAUSE_MS = 1400

interface PaymentStepProps {
  formId: string
  reservation: Reservation
  amount: number
  currency: string
  buyerPhone: string
  onStatusChange: (status: PaymentStatus) => void
  /** Called once with the receipt when the payment succeeds. */
  onPaid: (receipt: PaymentReceipt) => void
}

/**
 * Paying for the reservation. The person picks a method and fills in its
 * details; the step talks to the method only through its PaymentProvider, so
 * swapping the simulated providers for real ones would not change this screen.
 */
export function PaymentStep({ formId, reservation, amount, currency, buyerPhone, onStatusChange, onPaid }: PaymentStepProps) {
  const method = reservation.paymentMethod
  const [mobileDetails, setMobileDetails] = useState<MobileMoneyDetails>(() => mtnMoMoProvider.initialDetails({ phone: buyerPhone }))
  // Card details live only in this component while it is on screen: never in the store, never sent.
  const [cardDetails, setCardDetails] = useState<CardDetails>(() => cardProvider.initialDetails({ phone: buyerPhone }))
  const [submitted, setSubmitted] = useState(false)
  const [progress, setProgress] = useState<PaymentProgress | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const status: PaymentStatus = reservation.receipt ? "paid" : progress ? "pending" : "idle"
  const amountLabel = formatPrice(amount, currency)
  const methodName = PAYMENT_METHOD_NAME[method]

  useEffect(() => {
    onStatusChange(status)
  }, [status, onStatusChange])

  // After a moment to take in "Payment received", move on to the confirmation.
  useEffect(() => {
    if (status !== "paid") {
      return
    }
    const timer = window.setTimeout(() => appActions.goToReserveStep("confirmation"), SUCCESS_PAUSE_MS)
    return () => window.clearTimeout(timer)
  }, [status])

  // Leaving the step (back, closing the panel) cancels a payment still in progress.
  useEffect(() => () => abortRef.current?.abort(), [])

  const mobileProvider = method === "orange-money" ? orangeMoneyProvider : mtnMoMoProvider
  const mobileErrors: FieldErrors<MobileMoneyDetails> = submitted ? mobileProvider.validate(mobileDetails) : {}
  const cardErrors: FieldErrors<CardDetails> = submitted ? cardProvider.validate(cardDetails) : {}

  function focusFirstError(fieldNames: string[]) {
    const form = document.getElementById(formId)
    form?.querySelector<HTMLElement>(`[name="${fieldNames[0]}"]`)?.focus()
  }

  function run(pay: (signal: AbortSignal) => Promise<PaymentReceipt>) {
    const controller = new AbortController()
    abortRef.current = controller
    pay(controller.signal)
      .then((receipt) => onPaid(receipt))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          throw error
        }
      })
      .finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null
          setProgress(null)
        }
      })
  }

  function handleSubmit() {
    setSubmitted(true)
    const reference = reservation.invoiceNumber ?? ""
    if (method === "card") {
      const errors = cardProvider.validate(cardDetails)
      if (Object.keys(errors).length > 0) {
        focusFirstError((["number", "expiry", "cvc", "name"] as const).filter((field) => errors[field]))
        return
      }
      run((signal) =>
        cardProvider.pay({ amount, currency, reference, details: cardDetails }, { onProgress: setProgress, signal }),
      )
    } else {
      const errors = mobileProvider.validate(mobileDetails)
      if (errors.phone) {
        focusFirstError(["phone"])
        return
      }
      run((signal) =>
        mobileProvider.pay({ amount, currency, reference, details: mobileDetails }, { onProgress: setProgress, signal }),
      )
    }
  }

  if (status === "paid") {
    return <PaymentSuccess amount={amountLabel} methodName={methodName} />
  }

  if (progress) {
    return (
      <PaymentPending
        progress={progress}
        methodName={methodName}
        amount={amountLabel}
        phone={mobileDetails.phone}
        onCancel={() => abortRef.current?.abort()}
      />
    )
  }

  return (
    <>
      <StepHeading
        description={
          reservation.invoiceNumber ? `${amountLabel} due on invoice ${reservation.invoiceNumber}.` : `${amountLabel} due.`
        }
      >
        {STEP_TITLE.payment}
      </StepHeading>
      <div className="space-y-5">
        <DemoPaymentNote />
        <PaymentMethodPicker
          value={method}
          onChange={(next) => {
            appActions.choosePaymentMethod(next)
            setSubmitted(false)
          }}
        />
        {method === "card" ? (
          <CardForm formId={formId} details={cardDetails} errors={cardErrors} onChange={setCardDetails} onSubmit={handleSubmit} />
        ) : (
          <MobileMoneyForm
            formId={formId}
            methodName={methodName}
            details={mobileDetails}
            errors={mobileErrors}
            onChange={setMobileDetails}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </>
  )
}
