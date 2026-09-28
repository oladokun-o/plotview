import type { PlotStatus } from "@/types/layout"

interface PlotStatusGlyphProps {
  status: PlotStatus
  size: number
}

export function PlotStatusGlyph({ status, size }: PlotStatusGlyphProps) {
  const center = size / 2

  if (status === "reserved") {
    const half = size * 0.16
    return (
      <rect
        x={center - half}
        y={center - half}
        width={half * 2}
        height={half * 2}
        transform={`rotate(45 ${center} ${center})`}
        className="fill-reserved-mark"
      />
    )
  }

  if (status === "occupied") {
    return <circle cx={center} cy={center} r={size * 0.14} className="fill-occupied-mark" />
  }

  return null
}
