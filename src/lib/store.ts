import { useSyncExternalStore } from "react"
import type { PaymentMethodId, PaymentReceipt } from "./payments/types"

/**
 * Client state for the whole app, with no dependencies.
 *
 * Preferences (view, filter) and confirmed reservations persist to
 * localStorage, so a reserved plot stays reserved after a refresh. The
 * selected plot is not persisted here: it lives in the URL (see
 * useSelectedPlotUrl) so a selection can be shared as a link.
 *
 * During server rendering and hydration every reader sees DEFAULT_STATE, then
 * re-renders with the stored preferences, so there is never a hydration mismatch.
 */

export type MapView = "grid" | "sitemap"

/** The reserve flow's numbered steps, in order. Confirmation follows them and is not counted. */
export const RESERVE_STEPS = ["package", "details", "invoice", "payment"] as const
export type ReserveStep = (typeof RESERVE_STEPS)[number] | "confirmation"

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

/** A paid reservation, as kept after the flow ends. Only what the confirmation shows: no contact details. */
export interface ConfirmedReservation {
  /** e.g. RES-2026-4821 */
  reference: string
  plotId: string
  packageId: string
  amount: number
  currency: string
  invoiceNumber: string
  receipt: PaymentReceipt
  buyerName: string
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
  /** Every reservation made in this browser, newest last. */
  reservations: ConfirmedReservation[]
}

type Preferences = Pick<AppState, "view" | "availableOnly">

const STORAGE_KEY = "plotview:preferences:v1"
const RESERVATIONS_KEY = "plotview:reservations:v1"
/** Set by the arrival sequence (see MapShell); cleared on reset so the next visit plays it again. */
const ARRIVAL_KEY = "plotview:arrived"

const DEFAULT_STATE: AppState = {
  view: "grid",
  availableOnly: false,
  selectedPlotId: null,
  selectedPackageId: null,
  reservation: null,
  buyer: { fullName: "", phone: "", email: "", relationship: "" },
  reservations: [],
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

function isConfirmedReservation(value: unknown): value is ConfirmedReservation {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  const receipt = record.receipt as Record<string, unknown> | undefined
  return (
    typeof record.reference === "string" &&
    typeof record.plotId === "string" &&
    typeof record.packageId === "string" &&
    typeof record.amount === "number" &&
    typeof record.currency === "string" &&
    typeof record.invoiceNumber === "string" &&
    typeof record.buyerName === "string" &&
    typeof receipt === "object" &&
    receipt !== null &&
    typeof receipt.transactionId === "string" &&
    typeof receipt.paidAt === "string" &&
    (receipt.method === "mtn-momo" || receipt.method === "orange-money" || receipt.method === "card")
  )
}

function readReservations(): ConfirmedReservation[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RESERVATIONS_KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed.filter(isConfirmedReservation) : []
  } catch {
    return []
  }
}

function writeReservations(): void {
  try {
    window.localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(state.reservations))
  } catch {
    // Without storage, reservations last for the visit only.
  }
}

function ensureHydrated(): void {
  if (hydrated || typeof window === "undefined") {
    return
  }
  hydrated = true
  state = { ...state, ...readPreferences(), reservations: readReservations() }
}

function setState(patch: Partial<AppState>): void {
  ensureHydrated()
  state = { ...state, ...patch }
  if ("view" in patch || "availableOnly" in patch) {
    writePreferences()
  }
  if ("reservations" in patch) {
    writeReservations()
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
  /**
   * Records a successful payment and the reservation it pays for, at once, so
   * a paid plot is reserved even if the panel is closed straight away.
   */
  completeReservation(receipt: PaymentReceipt, confirmation: Omit<ConfirmedReservation, "receipt">) {
    if (!state.reservation) {
      return
    }
    setState({
      reservation: { ...state.reservation, receipt },
      reservations: [...state.reservations.filter((item) => item.plotId !== confirmation.plotId), { ...confirmation, receipt }],
    })
  },
  /** Clears everything this demo has stored, as if visiting for the first time. */
  resetDemo() {
    try {
      window.localStorage.removeItem(RESERVATIONS_KEY)
      window.localStorage.removeItem(STORAGE_KEY)
      window.sessionStorage.removeItem(ARRIVAL_KEY)
    } catch {
      // Nothing stored to clear.
    }
    state = { ...DEFAULT_STATE }
    listeners.forEach((listener) => listener())
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
