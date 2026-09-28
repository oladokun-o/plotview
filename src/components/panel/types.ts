import type { ConfirmedReservation } from "@/lib/store"
import type { Package, Plot, Section } from "@/types/layout"

/** Everything the detail panel needs to describe one plot. */
export interface PlotDetailsModel {
  plot: Plot
  section: Section
  packages: Package[]
  currency: string
  /** The closest plot that can be reserved, offered when this one cannot. */
  nearestAvailable: { plot: Plot; section: Section } | null
  /** Set when this visitor reserved the plot themselves. */
  ownReservation: ConfirmedReservation | null
}
