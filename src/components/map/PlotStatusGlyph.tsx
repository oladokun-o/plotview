import type { PlotStatus } from "@/types/layout"

interface PlotStatusGlyphProps {
  status: PlotStatus
  width: number
  height: number
}

/**
 * The shape that pairs with each status colour, so status never relies on colour
 * alone: nothing for available, a diamond for reserved, a dot for occupied.
 */
export function PlotStatusGlyph({ status, width, height }: PlotStatusGlyphProps) {
  const size = Math.min(width, height)
  const centerX = width / 2
  const centerY = height / 2

  if (status === "reserved") {
    const half = size * 0.17
    return (
      <rect
        x={centerX - half}
        y={centerY - half}
        width={half * 2}
        height={half * 2}
        transform={`rotate(45 ${centerX} ${centerY})`}
        className="pointer-events-none fill-reserved-mark"
      />
    )
  }

  if (status === "occupied") {
    return <circle cx={centerX} cy={centerY} r={size * 0.15} className="pointer-events-none fill-occupied-mark" />
  }

  return null
}
