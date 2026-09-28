import type { PlotStatus } from "@/types/layout"

export const PLOT_STATUSES: readonly PlotStatus[] = ["available", "reserved", "occupied"]

export const PLOT_STATUS_LABEL: Record<PlotStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  occupied: "Occupied",
}

export const STATUS_FILL_CLASS: Record<PlotStatus, string> = {
  available: "fill-available",
  reserved: "fill-reserved",
  occupied: "fill-occupied",
}

export const STATUS_STROKE_CLASS: Record<PlotStatus, string> = {
  available: "stroke-available-edge",
  reserved: "stroke-reserved-edge",
  occupied: "stroke-occupied-edge",
}
