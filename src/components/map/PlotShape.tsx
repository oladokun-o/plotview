import type { CSSProperties, FocusEvent, KeyboardEvent, PointerEvent } from "react"
import { cn } from "@/lib/cn"
import type { PlotPlacement } from "./mapGeometry"
import { PLOT_STATUS_LABEL, STATUS_FILL_CLASS, STATUS_MARK_FILL_CLASS, STATUS_STROKE_CLASS, plotNumber } from "./plotVisuals"
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
  /** When, in the arrival sequence, available plots brighten (ms). */
  arrivalDelay: number
  isSelected: boolean
  isDimmed: boolean
  /** The one plot reachable with Tab; arrow keys move between the rest. */
  isTabStop: boolean
  /** Just reserved: its new status spreads through it from the centre. */
  isInking?: boolean
}

/** One plot, drawn the same way in both views. Status shows as colour and a glyph. */
export function PlotShape({
  placement,
  sectionName,
  arrivalDelay,
  isSelected,
  isDimmed,
  isTabStop,
  isInking = false,
  onSelect,
  onHoverChange,
  onFocusChange,
}: PlotShapeProps) {
  const { plot, x, y, width, height } = placement
  const radius = Math.min(width, height) * 0.18
  const status = PLOT_STATUS_LABEL[plot.status].toLowerCase()
  const labelSize = Math.min(width * 0.44, height * 0.3)
  // When zoomed in, the glyph moves up to make room for the plot number below it.
  const glyphStyle = { "--glyph-shift": `${-height * 0.14}px` } as CSSProperties
  const inkClipId = `ink-${plot.id.replace(/[^a-zA-Z0-9_-]/g, "")}`

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
          data-arrival={plot.status === "available" ? "brighten" : undefined}
          style={{ animationDelay: `${arrivalDelay}ms` }}
          className={cn(
            STATUS_FILL_CLASS[plot.status],
            isSelected ? "stroke-accent" : STATUS_STROKE_CLASS[plot.status],
            "transition-[stroke] duration-150 group-hover:stroke-accent group-focus-visible:stroke-accent",
          )}
          strokeWidth={isSelected ? 2 : 1}
          vectorEffect="non-scaling-stroke"
        />
        {isInking && (
          <g aria-hidden="true" className="pointer-events-none">
            <clipPath id={inkClipId}>
              <rect width={width} height={height} rx={radius} />
            </clipPath>
            <g clipPath={`url(#${inkClipId})`}>
              <rect width={width} height={height} className="fill-available" />
              <circle
                data-ink="spread"
                cx={width / 2}
                cy={height / 2}
                r={Math.hypot(width, height) / 2}
                className="fill-reserved"
              />
            </g>
          </g>
        )}
        <g
          data-ink={isInking ? "mark" : undefined}
          style={glyphStyle}
          className="transition-[translate] duration-200 ease-standard group-data-[zoom=far]/scene:hidden group-data-[zoom=near]/scene:translate-y-(--glyph-shift)"
        >
          <PlotStatusGlyph status={plot.status} width={width} height={height} />
        </g>
        <text
          x={width / 2}
          y={height * 0.74}
          textAnchor="middle"
          dominantBaseline="central"
          aria-hidden="true"
          data-ink={isInking ? "mark" : undefined}
          className={cn(
            "pointer-events-none hidden font-medium tabular-nums group-data-[zoom=near]/scene:inline",
            STATUS_MARK_FILL_CLASS[plot.status],
          )}
          style={{ fontSize: labelSize }}
        >
          {plotNumber(plot.id)}
        </text>
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
