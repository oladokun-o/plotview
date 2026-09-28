import type { FocusEvent, KeyboardEvent, PointerEvent } from "react"
import { cn } from "@/lib/cn"
import type { PlotPlacement } from "./mapGeometry"
import { PLOT_STATUS_LABEL, STATUS_FILL_CLASS, STATUS_STROKE_CLASS } from "./plotVisuals"
import { PlotStatusGlyph } from "./PlotStatusGlyph"

export interface PlotInteractions {
  onSelect: (plotId: string) => void
  /** Pointer hover, from mouse or pen only; touch has no hover. */
  onHoverChange: (plotId: string | null) => void
  /** `visible` is true for keyboard focus, which should show the tooltip. */
  onFocusChange: (plotId: string | null, visible: boolean) => void
}

interface PlotShapeProps extends PlotInteractions {
  placement: PlotPlacement
  sectionName: string
  isSelected: boolean
  isDimmed: boolean
  /** The one plot reachable with Tab; arrow keys move between the rest. */
  isTabStop: boolean
}

/** One plot, drawn the same way in both views. Status shows as colour and a glyph. */
export function PlotShape({
  placement,
  sectionName,
  isSelected,
  isDimmed,
  isTabStop,
  onSelect,
  onHoverChange,
  onFocusChange,
}: PlotShapeProps) {
  const { plot, x, y, width, height } = placement
  const radius = Math.min(width, height) * 0.18
  const status = PLOT_STATUS_LABEL[plot.status].toLowerCase()

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onSelect(plot.id)
    }
  }

  function handlePointerEnter(event: PointerEvent<SVGGElement>) {
    if (event.pointerType !== "touch") {
      onHoverChange(plot.id)
    }
  }

  function handleFocus(event: FocusEvent<SVGGElement>) {
    onFocusChange(plot.id, event.currentTarget.matches(":focus-visible"))
  }

  return (
    <g
      transform={`translate(${x}, ${y})`}
      data-plot-id={plot.id}
      role="button"
      tabIndex={isTabStop ? 0 : -1}
      aria-label={`Plot ${plot.id}, ${status}. ${sectionName}, row ${plot.row}, column ${plot.col}.`}
      aria-pressed={isSelected}
      onClick={() => onSelect(plot.id)}
      onKeyDown={handleKeyDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={() => onHoverChange(null)}
      onFocus={handleFocus}
      onBlur={() => onFocusChange(null, false)}
      className={cn(
        "group cursor-pointer outline-none transition-opacity duration-200 ease-standard",
        isDimmed && !isSelected ? "opacity-25" : "opacity-100",
      )}
    >
      <g
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        filter={isSelected ? "url(#plot-lift)" : undefined}
        className={cn("transition-[scale] duration-300 ease-standard", isSelected ? "scale-[1.14]" : "scale-100")}
      >
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
        {/* Focus ring: shown for keyboard focus only, outside the plot so it never hides the status. */}
        <rect
          x={-3}
          y={-3}
          width={width + 6}
          height={height + 6}
          rx={radius + 2}
          className={cn(
            "fill-none stroke-focus opacity-0 transition-opacity duration-150 group-focus-visible:opacity-100",
            isSelected && "stroke-accent opacity-100",
          )}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </g>
  )
}
