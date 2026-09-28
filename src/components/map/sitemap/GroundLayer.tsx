import type { Ground, GroundKind } from "@/types/layout"
import { toPointsAttribute } from "./points"

const GROUND_CLASS: Record<GroundKind, string> = {
  lawn: "fill-map-lawn stroke-map-hedge",
  gravel: "fill-map-gravel stroke-map-gravel-edge",
  water: "fill-map-water stroke-map-water-edge",
  planting: "fill-map-planting stroke-none",
}

const GROUND_STROKE: Record<GroundKind, number> = {
  lawn: 6,
  gravel: 1.5,
  water: 3,
  planting: 0,
}

interface GroundLayerProps {
  grounds: Ground[]
}

/** Lawns, gravel, planting and water, in file order (later areas sit on top). */
export function GroundLayer({ grounds }: GroundLayerProps) {
  return (
    <g aria-hidden="true" data-arrival="ground">
      {grounds.map((ground) => (
        <polygon
          key={ground.id}
          points={toPointsAttribute(ground.points)}
          className={GROUND_CLASS[ground.kind]}
          strokeWidth={GROUND_STROKE[ground.kind]}
          strokeLinejoin="round"
        />
      ))}
    </g>
  )
}
