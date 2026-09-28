import type { PlotStatus } from "@/types/layout"

export const PLOT_STATUS_LABEL: Record<PlotStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  occupied: "Occupied",
}

export const STATUS_FILL_CLASS: Record<PlotStatus, string> = {
  available: "fill-plot-available",
  reserved: "fill-plot-reserved",
  occupied: "fill-plot-occupied",
}

export const PLOT_RADIUS = 6
export const SECTION_RADIUS = 14
