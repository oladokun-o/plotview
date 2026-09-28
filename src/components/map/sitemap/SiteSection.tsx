import type { SectionPlacement } from "../mapGeometry"
import { PlotShape } from "../PlotShape"

interface SiteSectionProps {
  placement: SectionPlacement
  selectedPlotId: string | null
  availableOnly: boolean
  onSelectPlot: (plotId: string) => void
}

const BED_MARGIN = 12

/** A section at its surveyed position and angle: a mown bed with its plots and name. */
export function SiteSection({ placement, selectedPlotId, availableOnly, onSelectPlot }: SiteSectionProps) {
  const { section, width, height, plots } = placement

  return (
    <g transform={`translate(${placement.x}, ${placement.y}) rotate(${placement.rotation})`}>
      <rect
        x={-BED_MARGIN}
        y={-BED_MARGIN}
        width={width + BED_MARGIN * 2}
        height={height + BED_MARGIN * 2}
        rx={10}
        className="fill-map-section"
      />
      <text x={-BED_MARGIN + 2} y={-BED_MARGIN - 10} className="pointer-events-none fill-map-label font-display text-[20px]">
        {section.name}
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
