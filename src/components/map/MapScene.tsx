import type { KeyboardEvent, Ref } from "react"
import type { MapView } from "@/lib/store"
import type { Layout } from "@/types/layout"
import { GridView } from "./grid/GridView"
import type { MapGeometry } from "./mapGeometry"
import type { PlotInteractions } from "./PlotShape"
import { SiteMapView } from "./sitemap/SiteMapView"

interface MapSceneProps extends PlotInteractions {
  layout: Layout
  geometry: MapGeometry
  view: MapView
  selectedPlotId: string | null
  tabStopPlotId: string | null
  inkPlotId: string | null
  availableOnly: boolean
  onKeyDown: (event: KeyboardEvent<SVGSVGElement>) => void
  /** The first-visit arrival sequence is playing. */
  arriving: boolean
  /** A view morph is flying the plots; hide them here until it lands. */
  morphing: boolean
  ref?: Ref<SVGSVGElement>
}

const INSTRUCTIONS_ID = "map-keyboard-instructions"

/** The drawable map for the active view, in content coordinates. */
export function MapScene({ layout, geometry, view, onKeyDown, arriving, morphing, ref, ...shared }: MapSceneProps) {
  return (
    <>
      <p id={INSTRUCTIONS_ID} className="sr-only">
        Use the arrow keys to move between plots. Press Enter to select a plot and Escape to clear the selection.
      </p>
      <svg
        ref={ref}
        width={geometry.width}
        height={geometry.height}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        className="group/scene block overflow-visible"
        // Chromium sizes SVG text for the screen from the zoom at layout time and
        // does not redo it when the camera moves, so text drawn after a camera move
        // could come out at the wrong size. Geometric text scales with the map instead.
        textRendering="geometricPrecision"
        data-view={view}
        data-arriving={arriving || undefined}
        data-morphing={morphing || undefined}
        role="group"
        aria-label={view === "grid" ? "Plots by section" : "Site map"}
        aria-describedby={INSTRUCTIONS_ID}
        onKeyDown={onKeyDown}
      >
        <defs>
          {/* The soft shadow under a selected plot. */}
          <filter id="plot-lift" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx={0} dy={2} stdDeviation={2.5} style={{ floodColor: "var(--map-shadow)" }} floodOpacity={1} />
          </filter>
        </defs>
        {view === "grid" ? (
          <GridView geometry={geometry} {...shared} />
        ) : (
          <SiteMapView layout={layout} geometry={geometry} {...shared} />
        )}
      </svg>
    </>
  )
}
