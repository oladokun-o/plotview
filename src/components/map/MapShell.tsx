"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react"
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
import { focusRect, frameRect, type CameraTransform, type Viewport } from "./camera"
import { computeGridLayout } from "./grid/gridLayout"
import { Legend } from "./Legend"
import type { MapGeometry } from "./mapGeometry"
import { MapScene } from "./MapScene"
import { MapViewport, type CameraApi } from "./MapViewport"
import { toScreenPlots } from "./morph"
import { MorphOverlay, type MorphPlan } from "./MorphOverlay"
import { PlotTooltip, type TooltipTarget } from "./PlotTooltip"
import { SiteMapNote } from "./SiteMapNote"
import { ARROW_DIRECTIONS, findNeighbour } from "./spatialNavigation"
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
/** On-screen plot size (px) below which plots are specks: glyphs are hidden. */
const ZOOM_FAR_BELOW = 7
/** On-screen plot size (px) from which plot numbers fit inside plots. */
const ZOOM_NEAR_FROM = 24
/** The arrival sequence plays once per browser session. */
const ARRIVAL_KEY = "plotview:arrived"
const ARRIVAL_MS = 2200

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function shouldPlayArrival(): boolean {
  if (prefersReducedMotion()) {
    return false
  }
  try {
    if (window.sessionStorage.getItem(ARRIVAL_KEY)) {
      return false
    }
    window.sessionStorage.setItem(ARRIVAL_KEY, "1")
  } catch {
    // Without storage the sequence may replay on reload; that is harmless.
  }
  return true
}

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

  const geometryFor = useCallback(
    (target: MapView) => (target === "grid" ? computeGridLayout(layout.sections, gridAspect) : computeSiteLayout(layout)),
    [layout, gridAspect],
  )
  const geometry = useMemo(() => geometryFor(view), [geometryFor, view])

  // Smallest plot side in the current view: what decides how much detail fits at a zoom level.
  const plotShortSide = useMemo(() => {
    const sides = geometry.sections.flatMap((section) => section.plots.map((plot) => Math.min(plot.width, plot.height)))
    return sides.length > 0 ? Math.min(...sides) : 1
  }, [geometry])

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

  const plotsById = useMemo(() => {
    const entries = new Map<string, TooltipTarget>()
    for (const section of layout.sections) {
      for (const plot of section.plots) {
        entries.set(plot.id, { plot, section })
      }
    }
    return entries
  }, [layout])

  const fromMultiplier = useMemo(
    () => Math.min(...layout.packages.map((pkg) => pkg.priceMultiplier)),
    [layout],
  )

  // Keyboard: the map is one tab stop, and arrow keys move it between plots.
  const [tabStopPlotId, setTabStopPlotId] = useState<string | null>(() => layout.sections[0]?.plots[0]?.id ?? null)
  const [hoverPlotId, setHoverPlotId] = useState<string | null>(null)
  const [focusPlotId, setFocusPlotId] = useState<string | null>(null)
  const tooltipPlotId = hoverPlotId ?? focusPlotId
  const sceneRef = useRef<SVGSVGElement>(null)

  // Pan/zoom frames are broadcast to the tooltip only, so the map itself never re-renders per frame.
  const transformListeners = useRef(new Set<() => void>())
  const subscribeTransform = useCallback((listener: () => void) => {
    transformListeners.current.add(listener)
    return () => {
      transformListeners.current.delete(listener)
    }
  }, [])

  // Zoom-dependent detail is switched with a data attribute and a CSS variable
  // written straight to the scene, so pan and zoom never re-render the map.
  const zoomState = useRef({ scale: 1, plotShortSide })
  const applyZoom = useCallback((scale: number) => {
    zoomState.current.scale = scale
    const scene = sceneRef.current
    if (!scene) {
      return
    }
    // Only the site map uses --map-scale, so only its subtree receives it. When it
    // reached grid text (which never reads it), Chromium painted that text without
    // the map's zoom at small scales.
    scene.querySelector<SVGGElement>("[data-scale-root]")?.style.setProperty("--map-scale", String(scale))
    const plotPixels = scale * zoomState.current.plotShortSide
    const level = plotPixels < ZOOM_FAR_BELOW ? "far" : plotPixels >= ZOOM_NEAR_FROM ? "near" : "mid"
    if (scene.dataset.zoom !== level) {
      scene.dataset.zoom = level
    }
  }, [])
  useEffect(() => {
    zoomState.current.plotShortSide = plotShortSide
    applyZoom(zoomState.current.scale)
  }, [plotShortSide, applyZoom])

  const handleTransform = useCallback(
    (scale: number) => {
      applyZoom(scale)
      transformListeners.current.forEach((listener) => listener())
    },
    [applyZoom],
  )

  // Arrival: the site draws itself once per visit. Any interaction ends it.
  const [arriving, setArriving] = useState(false)
  useEffect(() => {
    if (!arriving) {
      return
    }
    const stop = () => setArriving(false)
    const timer = window.setTimeout(stop, ARRIVAL_MS)
    const events = ["pointerdown", "wheel", "keydown"] as const
    events.forEach((type) => window.addEventListener(type, stop, { once: true, passive: true }))
    return () => {
      window.clearTimeout(timer)
      events.forEach((type) => window.removeEventListener(type, stop))
    }
  }, [arriving])

  // Morph: switching views flies each plot to its place in the other view.
  const [morph, setMorph] = useState<MorphPlan | null>(null)
  const morphTarget = useRef<CameraTransform | null>(null)

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
      if (!focusBounds && shouldPlayArrival()) {
        requestAnimationFrame(() => setArriving(true))
      }
    }

    // A view morph already decided where the camera ends up.
    const target = morphTarget.current
    if (target && geometryChanged) {
      morphTarget.current = null
      let frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => api.setTransform(target))
      })
      return () => cancelAnimationFrame(frame)
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

  // Escape clears the selection from anywhere except a text field (search handles its own Escape).
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const inField = event.target instanceof HTMLElement && event.target.closest("input, textarea, select")
      if (event.key === "Escape" && !inField && getAppState().selectedPlotId) {
        appActions.selectPlot(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  function handleViewChange(next: MapView) {
    const api = camera.current
    if (next === view || !api || viewport.width === 0 || prefersReducedMotion()) {
      appActions.setView(next)
      return
    }
    const nextGeometry = geometryFor(next)
    const selected = getAppState().selectedPlotId
    const selectedBounds = selected ? nextGeometry.plotBounds.get(selected) : undefined
    const target = selectedBounds
      ? focusRect(selectedBounds, viewport, PLOT_FOCUS_SIZE)
      : frameRect({ x: 0, y: 0, width: nextGeometry.width, height: nextGeometry.height }, viewport)

    const dimmed = new Set<string>()
    if (getAppState().availableOnly) {
      for (const [id, entry] of plotsById) {
        if (entry.plot.status !== "available") {
          dimmed.add(id)
        }
      }
    }
    morphTarget.current = target
    setArriving(false)
    setMorph({ from: toScreenPlots(geometry, api.getTransform()), to: toScreenPlots(nextGeometry, target), dimmed })
    appActions.setView(next)
  }

  function handleSelectPlot(plotId: string) {
    const deselect = getAppState().selectedPlotId === plotId
    appActions.selectPlot(deselect ? null : plotId)
    setTabStopPlotId(plotId)
    const bounds = geometry.plotBounds.get(plotId)
    if (!deselect && bounds) {
      camera.current?.reveal(bounds)
    }
  }

  const handleFocusChange = useCallback(
    (plotId: string | null, visible: boolean) => {
      setFocusPlotId(visible ? plotId : null)
      if (!plotId) {
        return
      }
      setTabStopPlotId(plotId)
      const bounds = geometry.plotBounds.get(plotId)
      if (visible && bounds) {
        camera.current?.reveal(bounds)
      }
    },
    [geometry],
  )

  // A click anywhere on the map that is not on a plot clears the selection.
  // Drags never reach here: the viewport swallows the click that ends a drag.
  function handleMapClick(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element) || !event.target.closest("[data-plot-id]")) {
      appActions.selectPlot(null)
    }
  }

  function handleSceneKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const direction = ARROW_DIRECTIONS[event.key]
    const current = event.target instanceof Element ? event.target.closest("[data-plot-id]") : null
    const fromId = current?.getAttribute("data-plot-id")
    if (!direction || !fromId) {
      return
    }
    event.preventDefault()
    const nextId = findNeighbour(geometry, fromId, direction)
    const next = nextId ? sceneRef.current?.querySelector<SVGGElement>(`[data-plot-id="${nextId}"]`) : null
    // preventScroll: the map moves through its own camera, never by scrolling the page.
    next?.focus({ preventScroll: true })
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
        onClick={handleMapClick}
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
          onTransform={handleTransform}
        >
          <MapScene
            ref={sceneRef}
            layout={layout}
            geometry={geometry}
            view={view}
            selectedPlotId={selectedPlotId}
            tabStopPlotId={selectedPlotId ?? tabStopPlotId}
            availableOnly={availableOnly}
            onSelect={handleSelectPlot}
            onHoverChange={setHoverPlotId}
            onFocusChange={handleFocusChange}
            onKeyDown={handleSceneKeyDown}
            arriving={arriving}
            morphing={morph !== null}
          />
        </MapViewport>
        {morph && <MorphOverlay plan={morph} onDone={() => setMorph(null)} />}
        <PlotTooltip
          target={tooltipPlotId ? (plotsById.get(tooltipPlotId) ?? null) : null}
          fromMultiplier={fromMultiplier}
          currency={layout.site.currency}
          sceneRef={sceneRef}
          subscribeTransform={subscribeTransform}
          topLimit={insets.top - EDGE}
        />
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
            <ViewToggle view={view} onChange={handleViewChange} />
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
