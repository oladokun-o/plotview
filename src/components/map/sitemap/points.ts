import type { Point } from "@/types/layout"

/** Formats points for an SVG `points` attribute. */
export function toPointsAttribute(points: Point[]): string {
  return points.map(([x, y]) => `${x},${y}`).join(" ")
}
