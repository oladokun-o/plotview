import type { MapView } from "@/lib/store"
import type { Layout } from "@/types/layout"
import { GridView } from "./grid/GridView"
import type { MapGeometry } from "./mapGeometry"
import { SiteMapView } from "./sitemap/SiteMapView"

interface MapSceneProps {
  layout: Layout
  geometry: MapGeometry
  view: MapView
  selectedPlotId: string | null
  availableOnly: boolean
  onSelectPlot: (plotId: string) => void
}

/** The drawable map for the active view, in content coordinates. */
export function MapScene({ layout, geometry, view, selectedPlotId, availableOnly, onSelectPlot }: MapSceneProps) {
  return (
    <svg
      width={geometry.width}
      height={geometry.height}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      className="block overflow-visible"
      role="group"
      aria-label={view === "grid" ? "Plots by section" : "Site map"}
    >
      {view === "grid" ? (
        <GridView
          geometry={geometry}
          selectedPlotId={selectedPlotId}
          availableOnly={availableOnly}
          onSelectPlot={onSelectPlot}
        />
      ) : (
        <SiteMapView
          layout={layout}
          geometry={geometry}
          selectedPlotId={selectedPlotId}
          availableOnly={availableOnly}
          onSelectPlot={onSelectPlot}
        />
      )}
    </svg>
  )
}
