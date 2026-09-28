import type { ReserveStep } from "@/lib/store"

/** What each step is called in the step indicator and its heading. */
export const STEP_TITLE: Record<ReserveStep, string> = {
  package: "Choose a package",
  details: "Your details",
  invoice: "Review the invoice",
  payment: "Payment",
}
