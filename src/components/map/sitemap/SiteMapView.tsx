import type { Layout } from "@/types/layout"
import type { MapGeometry } from "../mapGeometry"
import { GroundLayer } from "./GroundLayer"
import { LandmarkLayer } from "./LandmarkLayer"
import { PathLayer } from "./PathLayer"
import { SiteSection } from "./SiteSection"
import { TreeLayer } from "./TreeLayer"

interface SiteMapViewProps {
  layout: Layout
  geometry: MapGeometry
  selectedPlotId: string | null
  availableOnly: boolean
  onSelectPlot: (plotId: string) => void
}

/** The site drawn from its survey data, bottom layer first. */
export function SiteMapView({ layout, geometry, selectedPlotId, availableOnly, onSelectPlot }: SiteMapViewProps) {
  const { underlay } = layout

  return (
    <g>
      {underlay && (
        <image
          href={underlay.src}
          x={underlay.x}
          y={underlay.y}
          width={underlay.width}
          height={underlay.height}
          opacity={underlay.opacity ?? 1}
          preserveAspectRatio="none"
          aria-hidden="true"
        />
      )}
      <GroundLayer grounds={layout.grounds} />
      <PathLayer paths={layout.paths} />
      <LandmarkLayer landmarks={layout.landmarks} />
      {geometry.sections.map((placement) => (
        <SiteSection
          key={placement.section.id}
          placement={placement}
          selectedPlotId={selectedPlotId}
          availableOnly={availableOnly}
          onSelectPlot={onSelectPlot}
        />
      ))}
      <TreeLayer trees={layout.trees} />
    </g>
  )
}
