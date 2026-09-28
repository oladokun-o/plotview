import type { Ground, GroundKind } from "@/types/layout"
import { toPointsAttribute } from "./points"

const GROUND_FILL: Record<GroundKind, string> = {
  lawn: "fill-map-lawn",
  gravel: "fill-map-gravel",
  water: "fill-map-water",
  planting: "fill-map-planting",
}

interface GroundLayerProps {
  grounds: Ground[]
}

/** Lawns, gravel, planting and water, in file order (later areas sit on top). */
export function GroundLayer({ grounds }: GroundLayerProps) {
  return (
    <g aria-hidden="true">
      {grounds.map((ground) => (
        <polygon
          key={ground.id}
          points={toPointsAttribute(ground.points)}
          className={GROUND_FILL[ground.kind]}
          strokeLinejoin="round"
        />
      ))}
    </g>
  )
}
