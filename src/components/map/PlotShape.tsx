import type { KeyboardEvent } from "react"
import { cn } from "@/lib/cn"
import type { PlotPlacement } from "./mapGeometry"
import { PLOT_STATUS_LABEL, STATUS_FILL_CLASS, STATUS_STROKE_CLASS } from "./plotVisuals"
import { PlotStatusGlyph } from "./PlotStatusGlyph"

interface PlotShapeProps {
  placement: PlotPlacement
  isSelected: boolean
  isDimmed: boolean
  onSelect: (plotId: string) => void
}

/** One plot, drawn the same way in both views. Status shows as colour and a glyph. */
export function PlotShape({ placement, isSelected, isDimmed, onSelect }: PlotShapeProps) {
  const { plot, x, y, width, height } = placement
  const radius = Math.min(width, height) * 0.18
  const label = `Plot ${plot.id}, ${PLOT_STATUS_LABEL[plot.status].toLowerCase()}`

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onSelect(plot.id)
    }
  }

  return (
    <g
      transform={`translate(${x}, ${y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={isSelected}
      onClick={() => onSelect(plot.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        "group cursor-pointer outline-none transition-opacity duration-200 ease-standard",
        isDimmed && !isSelected ? "opacity-25" : "opacity-100",
      )}
    >
      {isSelected && (
        <rect
          x={-3}
          y={-3}
          width={width + 6}
          height={height + 6}
          rx={radius + 2}
          className="fill-none stroke-accent"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <rect
        width={width}
        height={height}
        rx={radius}
        className={cn(
          STATUS_FILL_CLASS[plot.status],
          isSelected ? "stroke-accent" : STATUS_STROKE_CLASS[plot.status],
          "transition-[stroke] duration-150 group-hover:stroke-accent group-focus-visible:stroke-accent",
        )}
        strokeWidth={isSelected ? 2 : 1}
        vectorEffect="non-scaling-stroke"
      />
      <PlotStatusGlyph status={plot.status} width={width} height={height} />
      <title>{label}</title>
    </g>
  )
}
