import type { SectionPlacement } from "../mapGeometry"
import { PlotShape, type PlotInteractions } from "../PlotShape"
import { AvailabilityBar } from "./AvailabilityBar"
import {
  GRID_GAP,
  GRID_ROW_GUTTER,
  GRID_SECTION_HEADER,
  GRID_SECTION_PADDING,
  availabilityLabel,
  cellLength,
  gridContentInset,
} from "./gridLayout"

interface SectionBlockProps extends PlotInteractions {
  placement: SectionPlacement
  /** Position in file order, used to stagger the arrival. */
  order: number
  selectedPlotId: string | null
  tabStopPlotId: string | null
  inkPlotId: string | null
  availableOnly: boolean
}

/** A section as a card: name, availability at a glance, row numbers and its plots. */
export function SectionBlock({
  placement,
  order,
  selectedPlotId,
  tabStopPlotId,
  inkPlotId,
  availableOnly,
  ...interactions
}: SectionBlockProps) {
  const { section, width, height, plots } = placement
  const available = section.plots.filter((plot) => plot.status === "available").length
  const reserved = section.plots.filter((plot) => plot.status === "reserved").length
  const rowHeight = cellLength(section)
  const plotsTop = GRID_SECTION_HEADER + GRID_SECTION_PADDING
  const contentLeft = GRID_SECTION_PADDING + gridContentInset(section)

  return (
    <g transform={`translate(${placement.x}, ${placement.y})`}>
      <g data-arrival="rise" style={{ animationDelay: `${120 + order * 110}ms` }}>
        <rect
          width={width}
          height={height}
          rx={14}
          className="fill-raised stroke-line-subtle"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <text x={GRID_SECTION_PADDING} y={GRID_SECTION_PADDING + 11} className="fill-primary font-display text-[16px]">
          {section.name}
        </text>
        <text
          x={width - GRID_SECTION_PADDING}
          y={GRID_SECTION_PADDING + 11}
          textAnchor="end"
          className="fill-secondary text-[10.5px] tabular-nums"
        >
          {availabilityLabel(available, section.plots.length)}
        </text>
        <AvailabilityBar
          x={GRID_SECTION_PADDING}
          y={GRID_SECTION_PADDING + 22}
          width={width - GRID_SECTION_PADDING * 2}
          available={available}
          reserved={reserved}
          total={section.plots.length}
        />
        <g aria-hidden="true">
          {Array.from({ length: section.rows }, (_, index) => (
            <text
              key={index}
              x={contentLeft + GRID_ROW_GUTTER / 2 - 2}
              y={plotsTop + index * (rowHeight + GRID_GAP) + rowHeight / 2}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-tertiary text-[9px] tabular-nums"
            >
              {index + 1}
            </text>
          ))}
        </g>
        {plots.map((plot) => (
          <PlotShape
            key={plot.plot.id}
            placement={plot}
            sectionName={section.name}
            isSelected={plot.plot.id === selectedPlotId}
            isDimmed={availableOnly && plot.plot.status !== "available"}
            arrivalDelay={700 + order * 110}
            isTabStop={plot.plot.id === tabStopPlotId}
            isInking={plot.plot.id === inkPlotId}
            {...interactions}
          />
        ))}
      </g>
    </g>
  )
}
