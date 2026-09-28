import type { KeyboardEvent } from "react"
import { PLOT_RADIUS, PLOT_STATUS_LABEL, STATUS_FILL_CLASS } from "../plotVisuals"
import { PlotStatusGlyph } from "../PlotStatusGlyph"
import type { Plot } from "@/types/layout"

interface PlotRectProps {
  plot: Plot
  x: number
  y: number
  size: number
  isSelected: boolean
  isDimmed: boolean
  onSelect: (plotId: string) => void
}

export function PlotRect({ plot, x, y, size, isSelected, isDimmed, onSelect }: PlotRectProps) {
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
      aria-label={`Plot ${plot.id}, ${PLOT_STATUS_LABEL[plot.status]}`}
      aria-pressed={isSelected}
      onClick={() => onSelect(plot.id)}
      onKeyDown={handleKeyDown}
      className={[
        "group cursor-pointer outline-none motion-safe:transition-opacity duration-150",
        isDimmed ? "opacity-30" : "opacity-100",
      ].join(" ")}
    >
      <rect
        width={size}
        height={size}
        rx={PLOT_RADIUS}
        className={[
          STATUS_FILL_CLASS[plot.status],
          isSelected ? "stroke-plot-selected stroke-2" : "stroke-border-neutral stroke-1",
          "group-focus-visible:stroke-plot-selected group-focus-visible:stroke-2",
        ].join(" ")}
      />
      <PlotStatusGlyph status={plot.status} size={size} />
      <title>{`Plot ${plot.id} — ${PLOT_STATUS_LABEL[plot.status]}`}</title>
    </g>
  )
}
