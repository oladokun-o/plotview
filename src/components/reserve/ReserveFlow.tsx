"use client"

import { ArrowLeft, X } from "lucide-react"
import { AnimatePresence, m } from "motion/react"
import { useCallback, useId, useState } from "react"
import type { PlotDetailsModel } from "@/components/panel/types"
import { Button } from "@/components/ui/Button"
import { IconButton } from "@/components/ui/IconButton"
import { formatPrice } from "@/lib/format"
import { createInvoiceNumber } from "@/lib/reservation"
import { RESERVE_STEPS, appActions, type BuyerDetails, type Reservation } from "@/lib/store"
import type { Package } from "@/types/layout"
import { DetailsStep } from "./DetailsStep"
import { InvoiceStep } from "./InvoiceStep"
import { PackageStep } from "./PackageStep"
import { PaymentStep, type PaymentStatus } from "./PaymentStep"
import { StepIndicator } from "./StepIndicator"

interface ReserveFlowProps {
  model: PlotDetailsModel
  reservation: Reservation
  buyer: BuyerDetails
  selectedPackage: Package
  onSelectPackage: (packageId: string) => void
  onClose: () => void
}

/** Steps slide in from the side they are travelling towards. */
const SLIDE = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -28 }),
}

/**
 * Reserving a plot, one step at a time, inside the detail panel or sheet:
 * package, then the buyer's details, then the invoice. Going back keeps
 * everything already entered.
 */
export function ReserveFlow({
  model,
  reservation,
  buyer,
  selectedPackage,
  onSelectPackage,
  onClose,
}: ReserveFlowProps) {
  const { plot, section, packages, currency } = model
  const { step } = reservation
  const formId = useId()
  const stepIndex = RESERVE_STEPS.indexOf(step)
  // Which way the last step change went, derived during render when the step changes.
  const [shownIndex, setShownIndex] = useState(stepIndex)
  const [direction, setDirection] = useState(1)
  if (stepIndex !== shownIndex) {
    setDirection(stepIndex > shownIndex ? 1 : -1)
    setShownIndex(stepIndex)
  }
  const total = plot.basePrice * selectedPackage.priceMultiplier
  const paymentFormId = `${formId}-payment`
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle")
  const handlePaymentStatus = useCallback((status: PaymentStatus) => setPaymentStatus(status), [])
  // Once money is moving (or has moved) there is no going back to edit the invoice.
  const canGoBack = step !== "payment" || paymentStatus === "idle"

  function goBack() {
    if (stepIndex === 0) {
      appActions.endReservation()
    } else {
      appActions.goToReserveStep(RESERVE_STEPS[stepIndex - 1])
    }
  }

  function showInvoice() {
    appActions.issueInvoiceNumber(createInvoiceNumber())
    appActions.goToReserveStep("invoice")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-line-subtle p-5 pt-4 md:px-6 md:pt-5">
        <div className="flex items-center gap-2">
          <IconButton
            label={stepIndex === 0 ? "Back to plot details" : "Back to the previous step"}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft aria-hidden="true" className="size-4" />}
            onClick={goBack}
            disabled={!canGoBack}
            className="-ml-2"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg leading-tight text-primary md:text-xl">Reserve plot {plot.id}</h2>
            <p className="truncate text-xs text-tertiary">
              {section.name} · Section {section.id}
            </p>
          </div>
          <IconButton
            label="Close"
            variant="ghost"
            size="sm"
            icon={<X aria-hidden="true" className="size-4" />}
            onClick={onClose}
            className="-mr-1"
          />
        </div>
        <div className="mt-3">
          <StepIndicator step={step} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-5 md:p-6">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <m.div
            key={step}
            custom={direction}
            variants={SLIDE}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", bounce: 0, duration: 0.32 }}
          >
            {step === "package" && (
              <PackageStep
                plot={plot}
                packages={packages}
                currency={currency}
                selectedPackage={selectedPackage}
                onSelectPackage={onSelectPackage}
              />
            )}
            {step === "details" && (
              <DetailsStep formId={formId} buyer={buyer} onChange={appActions.updateBuyer} onValid={showInvoice} />
            )}
            {step === "invoice" && reservation.invoiceNumber && (
              <InvoiceStep
                invoiceNumber={reservation.invoiceNumber}
                issuedOn={new Date()}
                plot={plot}
                section={section}
                pkg={selectedPackage}
                currency={currency}
                buyer={buyer}
              />
            )}
            {step === "payment" && (
              <PaymentStep
                formId={paymentFormId}
                reservation={reservation}
                amount={total}
                currency={currency}
                buyerPhone={buyer.phone}
                onStatusChange={handlePaymentStatus}
              />
            )}
          </m.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4 border-t border-line-subtle p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-secondary">{selectedPackage.name}</p>
          <p className="text-lg font-semibold text-primary tabular-nums">{formatPrice(total, currency)}</p>
        </div>
        {step === "package" && (
          <Button size="lg" onClick={() => appActions.goToReserveStep("details")}>
            Continue
          </Button>
        )}
        {step === "details" && (
          <Button size="lg" type="submit" form={formId}>
            Review invoice
          </Button>
        )}
        {step === "invoice" && (
          <Button size="lg" onClick={() => appActions.goToReserveStep("payment")}>
            Proceed to payment
          </Button>
        )}
        {step === "payment" && paymentStatus === "idle" && (
          <Button size="lg" type="submit" form={paymentFormId}>
            Pay {formatPrice(total, currency)}
          </Button>
        )}
      </div>
    </div>
  )
}
