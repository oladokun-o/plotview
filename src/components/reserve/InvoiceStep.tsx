import { formatPrice } from "@/lib/format"
import type { BuyerDetails } from "@/lib/store"
import type { Package, Plot, Section } from "@/types/layout"
import { StepHeading } from "./StepHeading"
import { STEP_TITLE } from "./steps"

interface InvoiceStepProps {
  invoiceNumber: string
  issuedOn: Date
  plot: Plot
  section: Section
  pkg: Package
  currency: string
  buyer: BuyerDetails
}

// The visitor's own date style (28 September 2026, September 28, 2026...). Safe
// because the flow only ever renders in the browser.
const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: "long" })

/** The sales record created before payment, as it would be in the office. */
export function InvoiceStep({ invoiceNumber, issuedOn, plot, section, pkg, currency, buyer }: InvoiceStepProps) {
  const total = plot.basePrice * pkg.priceMultiplier

  return (
    <>
      <StepHeading description="An invoice is issued before payment, so the reservation has a record from the start.">
        {STEP_TITLE.invoice}
      </StepHeading>
      <article aria-label={`Invoice ${invoiceNumber}`} className="rounded-lg bg-sunken p-4 ring-1 ring-inset ring-line-subtle">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-tertiary">Invoice</p>
            <p className="font-medium text-primary tabular-nums">{invoiceNumber}</p>
          </div>
          <p className="text-right text-xs text-secondary">
            Issued
            <br />
            {DATE_FORMAT.format(issuedOn)}
          </p>
        </header>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-line-subtle pt-4 text-sm">
          <dt className="text-secondary">Billed to</dt>
          <dd className="text-right text-primary">
            {buyer.fullName}
            <span className="block text-xs text-secondary">{buyer.phone}</span>
            <span className="block text-xs break-all text-secondary">{buyer.email}</span>
          </dd>
        </dl>

        <table className="mt-4 w-full border-t border-line-subtle text-sm">
          <caption className="sr-only">Items</caption>
          <tbody>
            <tr>
              <th scope="row" className="pt-4 pr-3 text-left font-normal text-primary">
                Plot {plot.id}
                <span className="block text-xs text-secondary">
                  {section.name}, row {plot.row}, column {plot.col}
                </span>
                <span className="block text-xs text-secondary">{pkg.name}</span>
              </th>
              <td className="pt-4 text-right align-top text-primary tabular-nums">{formatPrice(total, currency)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="pt-4 text-left font-normal text-secondary">
                Subtotal
              </th>
              <td className="pt-4 text-right text-secondary tabular-nums">{formatPrice(total, currency)}</td>
            </tr>
            <tr>
              <th scope="row" className="pt-1.5 text-left font-medium text-primary">
                Total due
              </th>
              <td className="pt-1.5 text-right text-base font-semibold text-primary tabular-nums">
                {formatPrice(total, currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </article>
      <p className="mt-3 text-xs text-tertiary">Sample prices. No real invoice is issued in this demo.</p>
    </>
  )
}
