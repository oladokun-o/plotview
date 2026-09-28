import { rotatedBounds, type Rect } from "@/lib/geometry"
import type { Plot, Section } from "@/types/layout"

/** Where one plot is drawn, in its section's local coordinates. */
export interface PlotPlacement {
  plot: Plot
  x: number
  y: number
  width: number
  height: number
}

/** Where one section is drawn: a translate + rotate, and its local size. */
export interface SectionPlacement {
  section: Section
  x: number
  y: number
  rotation: number
  width: number
  height: number
  plots: PlotPlacement[]
  /** Axis-aligned bounds on the map, including the rotation. */
  bounds: Rect
}

/**
 * Geometry shared by both map views. Each view places the same sections and
 * plots differently; the camera, search and selection work from this shape
 * and never need to know which view is active.
 */
export interface MapGeometry {
  width: number
  height: number
  sections: SectionPlacement[]
  /** Axis-aligned bounds of every plot on the map, by plot id. */
  plotBounds: Map<string, Rect>
  sectionBounds: Map<string, Rect>
}

/** Places a section's plots on its row/column grid, starting at (offsetX, offsetY). */
export function placePlots(
  section: Section,
  cellWidth: number,
  cellLength: number,
  gap: number,
  offsetX = 0,
  offsetY = 0,
): PlotPlacement[] {
  return section.plots.map((plot) => ({
    plot,
    x: offsetX + (plot.col - 1) * (cellWidth + gap),
    y: offsetY + (plot.row - 1) * (cellLength + gap),
    width: cellWidth,
    height: cellLength,
  }))
}

/** Derives the lookup tables every consumer needs from placed sections. */
export function buildGeometry(width: number, height: number, sections: SectionPlacement[]): MapGeometry {
  const plotBounds = new Map<string, Rect>()
  const sectionBounds = new Map<string, Rect>()

  for (const placement of sections) {
    sectionBounds.set(placement.section.id, placement.bounds)
    for (const plot of placement.plots) {
      const local: Rect = { x: plot.x + placement.x, y: plot.y + placement.y, width: plot.width, height: plot.height }
      plotBounds.set(
        plot.plot.id,
        placement.rotation === 0 ? local : rotatedBounds(local, placement.rotation, placement.x, placement.y),
      )
    }
  }

  return { width, height, sections, plotBounds, sectionBounds }
}
