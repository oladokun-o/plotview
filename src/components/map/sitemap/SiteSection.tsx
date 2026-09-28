import type { SectionPlacement } from "../mapGeometry"
import { PlotShape, type PlotInteractions } from "../PlotShape"
import { screenSizedLabel } from "./mapLabelStyle"

interface SiteSectionProps extends PlotInteractions {
  placement: SectionPlacement
  /** Position in file order (oldest first), used to stagger the arrival. */
  order: number
  selectedPlotId: string | null
  tabStopPlotId: string | null
  inkPlotId: string | null
  availableOnly: boolean
}

const BED_MARGIN = 12

/** A section at its surveyed position and angle: a mown bed edged by a low hedge, its plots and its name. */
export function SiteSection({ placement, order, selectedPlotId, tabStopPlotId, inkPlotId, availableOnly, ...interactions }: SiteSectionProps) {
  const { section, width, height, plots } = placement
  const bed = { x: -BED_MARGIN, y: -BED_MARGIN, width: width + BED_MARGIN * 2, height: height + BED_MARGIN * 2 }

  return (
    <g transform={`translate(${placement.x}, ${placement.y}) rotate(${placement.rotation})`}>
      <g data-arrival="rise" style={{ animationDelay: `${480 + order * 130}ms` }}>
        <rect {...bed} x={bed.x + 3} y={bed.y + 5} rx={10} className="fill-map-shadow" opacity={0.6} />
        <rect {...bed} rx={10} className="fill-map-section stroke-map-hedge" strokeWidth={3} />
        {plots.map((plot) => (
          <PlotShape
            key={plot.plot.id}
            placement={plot}
            sectionName={section.name}
            arrivalDelay={1050 + order * 90}
            isSelected={plot.plot.id === selectedPlotId}
            isDimmed={availableOnly && plot.plot.status !== "available"}
            isTabStop={plot.plot.id === tabStopPlotId}
            isInking={plot.plot.id === inkPlotId}
            {...interactions}
          />
        ))}
        <text
          x={bed.x + 2}
          y={bed.y}
          dy="-0.55em"
          className="pointer-events-none fill-map-label stroke-map-label-halo font-display"
          style={screenSizedLabel(15, Math.max(bed.width / 9, 12))}
        >
          {section.name}
        </text>
      </g>
    </g>
  )
}
