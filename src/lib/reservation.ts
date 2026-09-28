import type { Layout } from "@/types/layout"
import type { BuyerDetails } from "./store"

export type BuyerField = keyof BuyerDetails
export type BuyerErrors = Partial<Record<BuyerField, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Checks the buyer's details; returns a plain-language message per invalid field. */
export function validateBuyer(buyer: BuyerDetails): BuyerErrors {
  const errors: BuyerErrors = {}
  if (buyer.fullName.trim().length < 2) {
    errors.fullName = "Enter your full name."
  }
  const digits = buyer.phone.replace(/[^\d]/g, "")
  if (!/^\+?[\d\s().-]+$/.test(buyer.phone.trim()) || digits.length < 7 || digits.length > 15) {
    errors.phone = "Enter a phone number we can reach you on, with the country code if you are abroad."
  }
  if (!EMAIL_PATTERN.test(buyer.email.trim())) {
    errors.email = "Enter an email address, like name@example.com."
  }
  return errors
}

/** A readable reference such as INV-2026-4821. Random, since there is no backend to number invoices. */
export function createInvoiceNumber(date = new Date()): string {
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `INV-${date.getFullYear()}-${digits}`
}

/** The reference families keep, such as RES-2026-4821. */
export function createReservationReference(date = new Date()): string {
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `RES-${date.getFullYear()}-${digits}`
}

export const RELATIONSHIP_OPTIONS = [
  "Spouse or partner",
  "Child",
  "Parent",
  "Sibling",
  "Other family",
  "Friend",
  "Planning ahead for myself",
] as const

/**
 * The layout as this visitor sees it: plots they have reserved show as
 * reserved. Sections without such plots are reused as they are.
 */
export function withReservations(layout: Layout, reservedPlotIds: ReadonlySet<string>): Layout {
  if (reservedPlotIds.size === 0) {
    return layout
  }
  return {
    ...layout,
    sections: layout.sections.map((section) =>
      section.plots.some((plot) => reservedPlotIds.has(plot.id) && plot.status === "available")
        ? {
            ...section,
            plots: section.plots.map((plot) =>
              reservedPlotIds.has(plot.id) && plot.status === "available" ? { ...plot, status: "reserved" as const } : plot,
            ),
          }
        : section,
    ),
  }
}
