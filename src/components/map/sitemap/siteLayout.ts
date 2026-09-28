import { rotatedBounds } from "@/lib/geometry"
import type { Layout } from "@/types/layout"
import { buildGeometry, placePlots, type MapGeometry } from "../mapGeometry"

/** Places sections and plots at their surveyed positions from `layout.json`. */
export function computeSiteLayout(layout: Layout): MapGeometry {
  const placements = layout.sections.map((section) => {
    const length = section.plotLength ?? section.plotSize
    const width = section.cols * section.plotSize + (section.cols - 1) * section.gap
    const height = section.rows * length + (section.rows - 1) * section.gap
    const rotation = section.rotation ?? 0
    return {
      section,
      x: section.x,
      y: section.y,
      rotation,
      width,
      height,
      plots: placePlots(section, section.plotSize, length, section.gap),
      bounds: rotatedBounds({ x: section.x, y: section.y, width, height }, rotation, section.x, section.y),
    }
  })

  return buildGeometry(layout.site.width, layout.site.height, placements)
}
