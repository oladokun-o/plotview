import type { CSSProperties } from "react"

/**
 * Text that stays the same size on screen as the map zooms, so names are always
 * readable. The map writes its current scale to `--map-scale` on the scene on
 * every pan/zoom frame (see MapShell), so labels counter-scale in CSS without
 * re-rendering React.
 *
 * `maxUnits` caps the size in map units: zoomed far out, a label shrinks with
 * the map instead of growing past the thing it names. A halo in the ground
 * colour keeps text readable over paths and planting.
 */
export function screenSizedLabel(pixels: number, maxUnits: number): CSSProperties {
  return {
    fontSize: `min(calc(${pixels}px / var(--map-scale, 1)), ${maxUnits}px)`,
    strokeWidth: `min(calc(3px / var(--map-scale, 1)), ${maxUnits / 5}px)`,
    paintOrder: "stroke",
    strokeLinejoin: "round",
  }
}
