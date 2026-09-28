import { useSyncExternalStore } from "react"
import type { PaymentMethodId, PaymentReceipt } from "./payments/types"

/**
 * Client state for the whole app, with no dependencies.
 *
 * Preferences (view, filter) persist to localStorage. The selected plot is not
 * persisted here: it lives in the URL (see useSelectedPlotUrl) so a selection
 * can be shared as a link.
 *
 * During server rendering and hydration every reader sees DEFAULT_STATE, then
 * re-renders with the stored preferences, so there is never a hydration mismatch.
 */

export type MapView = "grid" | "sitemap"

/** The reserve flow's steps, in order. */
export const RESERVE_STEPS = ["package", "details", "invoice", "payment"] as const
export type ReserveStep = (typeof RESERVE_STEPS)[number]

export interface BuyerDetails {
  fullName: string
  phone: string
  email: string
  /** Optional; an empty string when not given. */
  relationship: string
}

/** A reservation in progress for one plot. */
export interface Reservation {
  plotId: string
  step: ReserveStep
  /** Issued when the invoice step is first reached, then kept. */
  invoiceNumber: string | null
  paymentMethod: PaymentMethodId
  /** Set once payment succeeds. Card details are never kept, only the receipt. */
  receipt: PaymentReceipt | null
}

export interface AppState {
  view: MapView
  availableOnly: boolean
  selectedPlotId: string | null
  /** The package chosen in the detail panel; carried into the reserve flow. */
  selectedPackageId: string | null
  reservation: Reservation | null
  /** Kept across plots and back navigation, so nothing has to be typed twice. */
  buyer: BuyerDetails
}

type Preferences = Pick<AppState, "view" | "availableOnly">

const STORAGE_KEY = "plotview:preferences:v1"

const DEFAULT_STATE: AppState = {
  view: "grid",
  availableOnly: false,
  selectedPlotId: null,
  selectedPackageId: null,
  reservation: null,
  buyer: { fullName: "", phone: "", email: "", relationship: "" },
}

let state: AppState = DEFAULT_STATE
let hydrated = false
const listeners = new Set<() => void>()

function readPreferences(): Partial<Preferences> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) {
      return {}
    }
    const record = parsed as Record<string, unknown>
    const preferences: Partial<Preferences> = {}
    if (record.view === "grid" || record.view === "sitemap") {
      preferences.view = record.view
    }
    if (typeof record.availableOnly === "boolean") {
      preferences.availableOnly = record.availableOnly
    }
    return preferences
  } catch {
    return {}
  }
}

function writePreferences(): void {
  try {
    const preferences: Preferences = { view: state.view, availableOnly: state.availableOnly }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Storage can be unavailable (private mode, blocked); preferences then last for the visit only.
  }
}

function ensureHydrated(): void {
  if (hydrated || typeof window === "undefined") {
    return
  }
  hydrated = true
  state = { ...state, ...readPreferences() }
}

function setState(patch: Partial<AppState>): void {
  ensureHydrated()
  state = { ...state, ...patch }
  if ("view" in patch || "availableOnly" in patch) {
    writePreferences()
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Reads a slice of app state. The selector must return a primitive or a stable reference. */
export function useAppState<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureHydrated()
      return selector(state)
    },
    () => selector(DEFAULT_STATE),
  )
}

export function getAppState(): AppState {
  ensureHydrated()
  return state
}

export const appActions = {
  setView(view: MapView) {
    setState({ view })
  },
  setAvailableOnly(availableOnly: boolean) {
    setState({ availableOnly })
  },
  selectPlot(plotId: string | null) {
    // Choosing another plot (or none) leaves the reserve flow; the buyer's details stay.
    const reservation = state.reservation?.plotId === plotId ? state.reservation : null
    setState({ selectedPlotId: plotId, reservation })
  },
  startReservation(plotId: string) {
    setState({ reservation: { plotId, step: "package", invoiceNumber: null, paymentMethod: "mtn-momo", receipt: null } })
  },
  goToReserveStep(step: ReserveStep) {
    if (state.reservation) {
      setState({ reservation: { ...state.reservation, step } })
    }
  },
  issueInvoiceNumber(invoiceNumber: string) {
    if (state.reservation && !state.reservation.invoiceNumber) {
      setState({ reservation: { ...state.reservation, invoiceNumber } })
    }
  },
  choosePaymentMethod(paymentMethod: PaymentMethodId) {
    if (state.reservation) {
      setState({ reservation: { ...state.reservation, paymentMethod } })
    }
  },
  recordPayment(receipt: PaymentReceipt) {
    if (state.reservation) {
      setState({ reservation: { ...state.reservation, receipt } })
    }
  },
  endReservation() {
    setState({ reservation: null })
  },
  updateBuyer(patch: Partial<BuyerDetails>) {
    setState({ buyer: { ...state.buyer, ...patch } })
  },
  selectPackage(packageId: string) {
    setState({ selectedPackageId: packageId })
  },
}
