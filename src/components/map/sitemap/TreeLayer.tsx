import type { Tree } from "@/types/layout"

interface TreeLayerProps {
  trees: Tree[]
}

/**
 * Tree canopies, drawn above everything on the ground: a soft offset shadow,
 * the crown, and a lighter highlight on the sunward side for a sense of depth.
 */
export function TreeLayer({ trees }: TreeLayerProps) {
  return (
    <g aria-hidden="true" className="pointer-events-none">
      {trees.map((tree, index) => (
        <circle
          key={`shadow-${index}`}
          cx={tree.x + tree.radius * 0.22}
          cy={tree.y + tree.radius * 0.3}
          r={tree.radius * 1.02}
          className="fill-map-shadow"
        />
      ))}
      {trees.map((tree, index) => (
        <g key={`tree-${index}`} data-arrival="tree" style={{ animationDelay: `${420 + (index % 24) * 22}ms` }}>
          <circle cx={tree.x} cy={tree.y} r={tree.radius} className="fill-map-canopy stroke-map-canopy-edge" strokeWidth={1.2} />
          <circle
            cx={tree.x - tree.radius * 0.28}
            cy={tree.y - tree.radius * 0.3}
            r={tree.radius * 0.52}
            className="fill-map-canopy-highlight"
            opacity={0.75}
          />
        </g>
      ))}
    </g>
  )
}
