import type { MapGeometry } from "../mapGeometry"
import { SectionBlock } from "./SectionBlock"

interface GridViewProps {
  geometry: MapGeometry
  selectedPlotId: string | null
  availableOnly: boolean
  onSelectPlot: (plotId: string) => void
}

/** Sections as labelled blocks, plots in rows and columns. Needs no spatial data. */
export function GridView({ geometry, selectedPlotId, availableOnly, onSelectPlot }: GridViewProps) {
  return (
    <g>
      {geometry.sections.map((placement) => (
        <SectionBlock
          key={placement.section.id}
          placement={placement}
          selectedPlotId={selectedPlotId}
          availableOnly={availableOnly}
          onSelectPlot={onSelectPlot}
        />
      ))}
    </g>
  )
}
