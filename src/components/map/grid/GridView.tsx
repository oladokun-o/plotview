import type { MapGeometry } from "../mapGeometry"
import type { PlotInteractions } from "../PlotShape"
import { SectionBlock } from "./SectionBlock"

interface GridViewProps extends PlotInteractions {
  geometry: MapGeometry
  selectedPlotId: string | null
  tabStopPlotId: string | null
  availableOnly: boolean
}

/** Sections as labelled blocks, plots in rows and columns. Needs no spatial data. */
export function GridView({ geometry, ...shared }: GridViewProps) {
  return (
    <g>
      {geometry.sections.map((placement) => (
        <SectionBlock key={placement.section.id} placement={placement} {...shared} />
      ))}
    </g>
  )
}
