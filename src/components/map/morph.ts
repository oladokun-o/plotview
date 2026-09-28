import { rotatePoint } from "@/lib/geometry"
import type { PlotStatus } from "@/types/layout"
import type { CameraTransform } from "./camera"
import type { MapGeometry } from "./mapGeometry"

/** Where a plot appears on screen: its centre, size and angle, in viewport pixels. */
export interface ScreenPlot {
  id: string
  status: PlotStatus
  centerX: number
  centerY: number
  width: number
  height: number
  rotation: number
  /** Position in file order, used to ripple the morph section by section. */
  order: number
}

/** Projects every plot of a view onto the screen for a given camera transform. */
export function toScreenPlots(geometry: MapGeometry, camera: CameraTransform): Map<string, ScreenPlot> {
  const plots = new Map<string, ScreenPlot>()
  geometry.sections.forEach((placement, order) => {
    for (const plot of placement.plots) {
      const [localX, localY] = rotatePoint(plot.x + plot.width / 2, plot.y + plot.height / 2, placement.rotation)
      plots.set(plot.plot.id, {
        id: plot.plot.id,
        status: plot.plot.status,
        centerX: camera.x + (placement.x + localX) * camera.scale,
        centerY: camera.y + (placement.y + localY) * camera.scale,
        width: plot.width * camera.scale,
        height: plot.height * camera.scale,
        rotation: placement.rotation,
        order,
      })
    }
  })
  return plots
}

/** A CSS transform that places a 1x1 square (centred on the origin) exactly over a plot. */
export function screenPlotTransform(plot: ScreenPlot): string {
  return `translate(${plot.centerX}px, ${plot.centerY}px) rotate(${plot.rotation}deg) scale(${plot.width}, ${plot.height})`
}
