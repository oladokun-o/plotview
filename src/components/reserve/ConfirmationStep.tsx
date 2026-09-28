"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { formatPrice } from "@/lib/format"
import { PAYMENT_METHOD_NAME } from "@/lib/payments"
import type { ConfirmedReservation } from "@/lib/store"
import type { Package, Plot, Section } from "@/types/layout"
import { StepHeading } from "./StepHeading"
import { STEP_TITLE } from "./steps"

interface ConfirmationStepProps {
  confirmation: ConfirmedReservation
  plot: Plot
  section: Section
  pkg: Package
}

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" })

/** The reference to keep, and a plain summary of what was reserved and paid. */
export function ConfirmationStep({ confirmation, plot, section, pkg }: ConfirmationStepProps) {
  const [copied, setCopied] = useState(false)
  const { reference, receipt } = confirmation

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be unavailable; the reference is still on screen to write down.
    }
  }

  const rows: [string, string][] = [
    ["Plot", `Plot ${plot.id}, row ${plot.row}, column ${plot.col}`],
    ["Section", `${section.name} (Section ${section.id})`],
    ["Package", pkg.name],
    ["Amount paid", formatPrice(confirmation.amount, confirmation.currency)],
    ["Paid with", PAYMENT_METHOD_NAME[receipt.method]],
    ["Transaction", receipt.transactionId],
    ["Invoice", confirmation.invoiceNumber],
    ["Date", DATE_FORMAT.format(new Date(receipt.paidAt))],
  ]

  return (
    <>
      <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-accent text-on-accent">
        <Check aria-hidden="true" className="size-6" strokeWidth={2.25} />
      </div>
      <StepHeading
        description={`Plot ${plot.id} is reserved in the name of ${confirmation.buyerName}. The office will be in touch to arrange the next steps.`}
      >
        {STEP_TITLE.confirmation}
      </StepHeading>

      <div className="rounded-lg bg-sunken p-4 ring-1 ring-inset ring-line-subtle">
        <p className="text-xs text-tertiary">Your reference</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="font-display text-2xl text-primary tabular-nums">{reference}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={copyReference}
            leadingIcon={copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-secondary">Keep this reference. The office will ask for it.</p>
      </div>

      <dl className="mt-5 divide-y divide-line-subtle text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2.5">
            <dt className="text-secondary">{label}</dt>
            <dd className="text-right text-primary tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-tertiary">Sample data. No real reservation or payment has been made.</p>
    </>
  )
}
