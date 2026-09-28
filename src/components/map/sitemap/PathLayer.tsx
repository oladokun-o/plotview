import type { CSSProperties } from "react"
import type { Path, Point } from "@/types/layout"
import { toPointsAttribute } from "./points"

interface PathLayerProps {
  paths: Path[]
}

function pathLength(points: Point[]): number {
  let length = 0
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
  }
  return length
}

/** Lets the arrival sequence draw each path along its length. */
function traceStyle(path: Path, index: number): CSSProperties {
  const length = Math.ceil(pathLength(path.points))
  return {
    strokeDasharray: length,
    ["--path-length" as string]: length,
    animationDelay: `${160 + index * 70}ms`,
  }
}

/**
 * Roads get a kerb edge under a paved surface; footpaths are gravel with a
 * slightly darker edge, so both keep crisp outlines at any zoom.
 */
export function PathLayer({ paths }: PathLayerProps) {
  const roads = paths.filter((path) => path.kind === "road")
  const footpaths = paths.filter((path) => path.kind === "footpath")

  return (
    <g aria-hidden="true" fill="none" strokeLinejoin="round">
      {footpaths.map((path, index) => (
        <g key={path.id} data-arrival="path" style={traceStyle(path, index + roads.length)}>
          <polyline
            points={toPointsAttribute(path.points)}
            className="stroke-map-gravel-edge"
            strokeWidth={path.width + 2}
            strokeLinecap="round"
          />
          <polyline
            points={toPointsAttribute(path.points)}
            className="stroke-map-gravel"
            strokeWidth={path.width}
            strokeLinecap="round"
          />
        </g>
      ))}
      {roads.map((path, index) => (
        <g key={path.id} data-arrival="path" style={traceStyle(path, index)}>
          <polyline
            points={toPointsAttribute(path.points)}
            className="stroke-map-road-edge"
            strokeWidth={path.width + 4}
            strokeLinecap="butt"
          />
          <polyline
            points={toPointsAttribute(path.points)}
            className="stroke-map-road"
            strokeWidth={path.width}
            strokeLinecap="butt"
          />
        </g>
      ))}
    </g>
  )
}
