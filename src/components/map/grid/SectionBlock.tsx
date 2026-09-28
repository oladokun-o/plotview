import type { SectionPlacement } from "../mapGeometry"
import { PlotShape } from "../PlotShape"
import { GRID_SECTION_PADDING } from "./gridLayout"

interface SectionBlockProps {
  placement: SectionPlacement
  selectedPlotId: string | null
  availableOnly: boolean
  onSelectPlot: (plotId: string) => void
}

export function SectionBlock({ placement, selectedPlotId, availableOnly, onSelectPlot }: SectionBlockProps) {
  const { section, width, height, plots } = placement
  const available = section.plots.filter((plot) => plot.status === "available").length

  return (
    <g transform={`translate(${placement.x}, ${placement.y})`}>
      <rect
        width={width}
        height={height}
        rx={14}
        className="fill-raised stroke-line-subtle"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <text x={GRID_SECTION_PADDING} y={GRID_SECTION_PADDING + 12} className="fill-primary font-display text-[15px]">
        {section.name}
      </text>
      <text
        x={width - GRID_SECTION_PADDING}
        y={GRID_SECTION_PADDING + 12}
        textAnchor="end"
        className="fill-tertiary text-[11px] tabular-nums"
      >
        {`Section ${section.id} · ${available} available`}
      </text>
      {plots.map((plot) => (
        <PlotShape
          key={plot.plot.id}
          placement={plot}
          isSelected={plot.plot.id === selectedPlotId}
          isDimmed={availableOnly && plot.plot.status !== "available"}
          onSelect={onSelectPlot}
        />
      ))}
    </g>
  )
}
