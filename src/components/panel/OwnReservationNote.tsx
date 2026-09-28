import { formatPrice } from "@/lib/format"
import { PAYMENT_METHOD_NAME } from "@/lib/payments"
import type { ConfirmedReservation } from "@/lib/store"

interface OwnReservationNoteProps {
  reservation: ConfirmedReservation
}

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: "long" })

/** Shown instead of "reserved" for a plot this visitor reserved themselves. */
export function OwnReservationNote({ reservation }: OwnReservationNoteProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-secondary">
        You reserved this plot on {DATE_FORMAT.format(new Date(reservation.receipt.paidAt))}.
      </p>
      <div className="rounded-md bg-sunken p-3 ring-1 ring-inset ring-line-subtle">
        <p className="text-xs text-tertiary">Your reference</p>
        <p className="mt-0.5 font-display text-xl text-primary tabular-nums">{reservation.reference}</p>
        <p className="mt-1 text-xs text-secondary tabular-nums">
          {formatPrice(reservation.amount, reservation.currency)} paid with {PAYMENT_METHOD_NAME[reservation.receipt.method]}
        </p>
      </div>
    </div>
  )
}
