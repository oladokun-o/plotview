"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { SampleDataBadge } from "@/components/SampleDataBadge"
import { cn } from "@/lib/cn"
import type { Insets } from "@/lib/geometry"
import type { SearchResult } from "@/lib/search"
import { appActions, getAppState, useAppState, type MapView } from "@/lib/store"
import { useElementSize } from "@/lib/useElementSize"
import { useSelectedPlotUrl } from "@/lib/useSelectedPlotUrl"
import type { Branding } from "@/types/branding"
import type { Layout, PlotStatus } from "@/types/layout"
import { AvailableOnlyToggle } from "./AvailableOnlyToggle"
import type { Viewport } from "./camera"
import { computeGridLayout } from "./grid/gridLayout"
import { Legend } from "./Legend"
import type { MapGeometry } from "./mapGeometry"
import { MapScene } from "./MapScene"
import { MapViewport, type CameraApi } from "./MapViewport"
import { SiteMapNote } from "./SiteMapNote"
import { computeSiteLayout } from "./sitemap/siteLayout"
import { TopBar } from "./TopBar"
import { ViewToggle } from "./ViewToggle"
import { ZoomControls } from "./ZoomControls"

interface MapShellProps {
  layout: Layout
  branding: Branding
}

/** Space kept clear around the map for the floating controls, in pixels. */
const EDGE = 16
/** The filter row under the top bar. */
const FILTER_ROW = 44
/** A focused plot's short side on screen, in pixels: big enough to see, small enough to keep its neighbours. */
const PLOT_FOCUS_SIZE = 32

/**
 * The full-screen map and everything floating over it. Owns which view is shown,
 * where the camera goes, and how search, selection and the URL connect.
 */
export function MapShell({ layout, branding }: MapShellProps) {
  const storedView = useAppState((state) => state.view)
  const availableOnly = useAppState((state) => state.availableOnly)
  const selectedPlotId = useAppState((state) => state.selectedPlotId)

  const hasSiteMap = layout.grounds.length + layout.paths.length + layout.landmarks.length > 0
  const view: MapView = hasSiteMap ? storedView : "grid"

  const [viewportRef, viewportSize] = useElementSize<HTMLDivElement>()
  const [topBarRef, topBarSize] = useElementSize<HTMLDivElement>()

  const insets = useMemo<Insets>(
    () => ({ top: topBarSize.height + FILTER_ROW + EDGE * 1.5, right: EDGE, bottom: EDGE, left: EDGE }),
    [topBarSize.height],
  )
  const viewport = useMemo<Viewport>(
    () => ({ width: viewportSize.width, height: viewportSize.height, insets }),
    [viewportSize.width, viewportSize.height, insets],
  )

  // Grid blocks re-flow to the visible area's shape; rounded so tiny resizes do not re-flow.
  const visibleWidth = viewport.width - insets.left - insets.right
  const visibleHeight = viewport.height - insets.top - insets.bottom
  const gridAspect = visibleWidth > 0 && visibleHeight > 0 ? Math.round((visibleWidth / visibleHeight) * 10) / 10 : 1

  const geometry = useMemo(
    () => (view === "grid" ? computeGridLayout(layout.sections, gridAspect) : computeSiteLayout(layout)),
    [view, gridAspect, layout],
  )

  const counts = useMemo(() => {
    const totals: Record<PlotStatus, number> = { available: 0, reserved: 0, occupied: 0 }
    for (const section of layout.sections) {
      for (const plot of section.plots) {
        totals[plot.status] += 1
      }
    }
    return totals
  }, [layout])

  const plotIds = useMemo(
    () => new Set(layout.sections.flatMap((section) => section.plots.map((plot) => plot.id))),
    [layout],
  )

  const camera = useRef<CameraApi | null>(null)
  const lastGeometry = useRef<MapGeometry | null>(null)
  const pendingFocus = useRef<string | null>(null)

  useSelectedPlotUrl(
    useCallback((plotId: string) => plotIds.has(plotId), [plotIds]),
    useCallback((plotId: string) => {
      pendingFocus.current = plotId
    }, []),
  )

  // The camera follows the map: a new view or re-flowed grid is framed again
  // (on the selected plot, if any); a resize alone refits only if the person
  // has not moved the map themselves.
  useEffect(() => {
    const api = camera.current
    if (!api || viewport.width === 0 || viewport.height === 0) {
      return
    }
    const firstFrame = lastGeometry.current === null
    const geometryChanged = lastGeometry.current !== geometry
    lastGeometry.current = geometry

    const focusId = pendingFocus.current ?? (geometryChanged ? getAppState().selectedPlotId : null)
    pendingFocus.current = null
    const focusBounds = focusId ? geometry.plotBounds.get(focusId) : undefined

    if (firstFrame) {
      // Frame the whole map at once so nothing flashes at the wrong size.
      api.fit({ animate: false })
    }

    const move = () => {
      if (focusBounds) {
        api.focus(focusBounds, { targetSize: PLOT_FOCUS_SIZE })
      } else if (geometryChanged && !firstFrame) {
        api.fit()
      } else if (!geometryChanged && !api.hasUserMoved()) {
        api.fit({ animate: false })
      }
    }

    // When the content size changes (first load, new view, re-flowed grid) the
    // pan/zoom layer re-measures on the next frame and would cancel an animated
    // move started now, so let it settle first.
    if (!geometryChanged) {
      move()
      return
    }
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(move)
    })
    return () => cancelAnimationFrame(frame)
  }, [geometry, viewport])

  function handleSelectPlot(plotId: string) {
    const deselect = getAppState().selectedPlotId === plotId
    appActions.selectPlot(deselect ? null : plotId)
    const bounds = geometry.plotBounds.get(plotId)
    if (!deselect && bounds) {
      camera.current?.reveal(bounds)
    }
  }

  function handlePick(result: SearchResult) {
    if (result.kind === "plot") {
      appActions.selectPlot(result.plot.id)
      const bounds = geometry.plotBounds.get(result.plot.id)
      if (bounds) {
        camera.current?.focus(bounds, { targetSize: PLOT_FOCUS_SIZE })
      }
    } else {
      const bounds = geometry.sectionBounds.get(result.section.id)
      if (bounds) {
        camera.current?.focus(bounds, { fill: 0.9, maxScale: 3 })
      }
    }
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-canvas">
      <div
        ref={viewportRef}
        className={cn(
          "absolute inset-0 transition-colors duration-500 ease-standard",
          view === "sitemap" ? "bg-map-ground" : "bg-canvas",
        )}
      >
        <MapViewport
          contentWidth={geometry.width}
          contentHeight={geometry.height}
          viewport={viewport}
          cameraRef={camera}
          label="Cemetery map. Drag to pan, pinch or scroll to zoom."
        >
          <MapScene
            layout={layout}
            geometry={geometry}
            view={view}
            selectedPlotId={selectedPlotId}
            availableOnly={availableOnly}
            onSelectPlot={handleSelectPlot}
          />
        </MapViewport>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 grid grid-cols-[1fr_auto] items-start gap-2 p-3 md:grid-cols-[360px_1fr_auto] md:p-4">
        <TopBar
          ref={topBarRef}
          layout={layout}
          branding={branding}
          onPick={handlePick}
          className="relative z-20 col-span-2 md:col-span-1"
        />
        <div className="col-start-1 row-start-2 flex flex-wrap items-start gap-2 md:col-span-2">
          <AvailableOnlyToggle checked={availableOnly} onChange={appActions.setAvailableOnly} />
          <Legend counts={counts} />
        </div>
        {hasSiteMap && (
          <div className="col-start-2 row-start-2 justify-self-end md:col-start-3 md:row-start-1">
            <ViewToggle view={view} onChange={appActions.setView} />
          </div>
        )}
        {hasSiteMap && view === "sitemap" && (
          <div className="col-span-2 row-start-3 justify-self-end md:col-span-1 md:col-start-3 md:row-start-2">
            <SiteMapNote />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-10 md:bottom-4 md:left-4">
        <SampleDataBadge />
      </div>

      <div className="pointer-events-none absolute right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 md:right-4 md:bottom-4">
        <ZoomControls
          onZoomIn={() => camera.current?.zoomIn()}
          onZoomOut={() => camera.current?.zoomOut()}
          onRecentre={() => camera.current?.fit()}
        />
      </div>
    </main>
  )
}
