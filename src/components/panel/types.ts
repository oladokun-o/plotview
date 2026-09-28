import type { Package, Plot, Section } from "@/types/layout"

/** Everything the detail panel needs to describe one plot. */
export interface PlotDetailsModel {
  plot: Plot
  section: Section
  packages: Package[]
  currency: string
  /** The closest plot that can be reserved, offered when this one cannot. */
  nearestAvailable: { plot: Plot; section: Section } | null
}
