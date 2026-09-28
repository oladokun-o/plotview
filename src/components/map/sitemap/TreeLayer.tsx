import type { Tree } from "@/types/layout"

interface TreeLayerProps {
  trees: Tree[]
}

/** Tree canopies with a soft offset shadow, drawn above everything on the ground. */
export function TreeLayer({ trees }: TreeLayerProps) {
  return (
    <g aria-hidden="true" className="pointer-events-none">
      {trees.map((tree, index) => (
        <circle
          key={`shadow-${index}`}
          cx={tree.x + tree.radius * 0.18}
          cy={tree.y + tree.radius * 0.24}
          r={tree.radius}
          className="fill-map-shadow"
        />
      ))}
      {trees.map((tree, index) => (
        <circle
          key={`canopy-${index}`}
          cx={tree.x}
          cy={tree.y}
          r={tree.radius}
          className="fill-map-canopy stroke-map-canopy-edge"
          strokeWidth={1.5}
        />
      ))}
    </g>
  )
}
