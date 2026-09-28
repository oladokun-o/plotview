import { rectCenter } from "@/lib/geometry"
import type { MapGeometry } from "./mapGeometry"

export type Direction = "up" | "down" | "left" | "right"

export const ARROW_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
}

/** How much sideways drift counts against a candidate, relative to forward distance. */
const DRIFT_WEIGHT = 3
/** Widest accepted drift per unit forward: about 60 degrees either side of straight ahead. */
const MAX_DRIFT_RATIO = 1.8

/**
 * The plot a keyboard user reaches by pressing an arrow key: the nearest plot
 * in that direction on screen, preferring ones straight ahead. Works from the
 * geometry alone, so it behaves the same in the grid and on the site map,
 * including across rotated sections and from one section to the next.
 */
export function findNeighbour(geometry: MapGeometry, fromId: string, direction: Direction): string | null {
  const from = geometry.plotBounds.get(fromId)
  if (!from) {
    return null
  }
  const [fromX, fromY] = rectCenter(from)
  const horizontal = direction === "left" || direction === "right"
  const sign = direction === "right" || direction === "down" ? 1 : -1

  let best: string | null = null
  let bestScore = Infinity
  for (const [id, rect] of geometry.plotBounds) {
    if (id === fromId) {
      continue
    }
    const [x, y] = rectCenter(rect)
    const forward = (horizontal ? x - fromX : y - fromY) * sign
    const drift = Math.abs(horizontal ? y - fromY : x - fromX)
    // Ignore plots behind, level with, or more sideways than ahead. Without this
    // cone, the end of a tilted row would "continue" into the row below it.
    if (forward <= 1 || drift > forward * MAX_DRIFT_RATIO) {
      continue
    }
    const score = forward + drift * DRIFT_WEIGHT
    if (score < bestScore) {
      bestScore = score
      best = id
    }
  }
  return best
}
