import type { Path } from "@/types/layout"
import { toPointsAttribute } from "./points"

interface PathLayerProps {
  paths: Path[]
}

/** Roads get a kerb edge under a paved surface; footpaths are a single gravel line. */
export function PathLayer({ paths }: PathLayerProps) {
  const roads = paths.filter((path) => path.kind === "road")
  const footpaths = paths.filter((path) => path.kind === "footpath")

  return (
    <g aria-hidden="true" fill="none" strokeLinejoin="round">
      {footpaths.map((path) => (
        <polyline
          key={path.id}
          points={toPointsAttribute(path.points)}
          className="stroke-map-gravel"
          strokeWidth={path.width}
          strokeLinecap="round"
        />
      ))}
      {roads.map((path) => (
        <polyline
          key={`${path.id}-edge`}
          points={toPointsAttribute(path.points)}
          className="stroke-map-road-edge"
          strokeWidth={path.width + 4}
          strokeLinecap="butt"
        />
      ))}
      {roads.map((path) => (
        <polyline
          key={path.id}
          points={toPointsAttribute(path.points)}
          className="stroke-map-road"
          strokeWidth={path.width}
          strokeLinecap="butt"
        />
      ))}
    </g>
  )
}
