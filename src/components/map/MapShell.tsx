"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react"
import type { PlotDetailsModel } from "@/components/panel/types"
import { SampleDataBadge } from "@/components/SampleDataBadge"
import { cn } from "@/lib/cn"
import { rectCenter, type Insets } from "@/lib/geometry"
import type { SearchResult } from "@/lib/search"
import { appActions, getAppState, useAppState, type MapView } from "@/lib/store"
import { useElementSize } from "@/lib/useElementSize"
import { useMediaQuery } from "@/lib/useMediaQuery"
import { withReservations } from "@/lib/reservation"
import { useSelectedPlotUrl } from "@/lib/useSelectedPlotUrl"
import type { Branding } from "@/types/branding"
import type { Layout, PlotStatus } from "@/types/layout"
import { AvailableOnlyToggle } from "./AvailableOnlyToggle"
import { focusRect, frameRect, type CameraTransform, type Viewport } from "./camera"
import { computeGridLayout } from "./grid/gridLayout"
import { Legend } from "./Legend"
import { MapScene } from "./MapScene"
import { MapViewport, type CameraApi } from "./MapViewport"
import { toScreenPlots } from "./morph"
import type { MorphPlan } from "./MorphOverlay"
import { PlotTooltip, type TooltipTarget } from "./PlotTooltip"
import { SiteMapNote } from "./SiteMapNote"
import { ARROW_DIRECTIONS, findNeighbour } from "./spatialNavigation"
import { computeSiteLayout } from "./sitemap/siteLayout"
import { TopBar } from "./TopBar"
import { ViewToggle } from "./ViewToggle"
import { ZoomControls } from "./ZoomControls"

// Needed only once a plot is selected or the view is switched, so they (and the
// motion library they use) stay out of the first load and are fetched when idle.
const loadDetailPanel = () => import("@/components/panel/DetailPanel")
const loadBottomSheet = () => import("@/components/panel/BottomSheet")
/** Set once the morph code has arrived; until then a view switch is instant rather than waiting on the network. */
let morphOverlayLoaded = false
const loadMorphOverlay = () =>
  import("./MorphOverlay").then((module) => {
    morphOverlayLoaded = true
    return module
  })
const DetailPanel = dynamic(() => loadDetailPanel().then((module) => module.DetailPanel), { ssr: false })
const BottomSheet = dynamic(() => loadBottomSheet().then((module) => module.BottomSheet), { ssr: false })
const MorphOverlay = dynamic(() => loadMorphOverlay().then((module) => module.MorphOverlay), { ssr: false })

function prefetchDeferredParts() {
  void loadDetailPanel()
  void loadBottomSheet()
  void loadMorphOverlay()
}

/** A camera move queued by a selection: aim at a plot, or just keep it in view. */
interface CameraRequest {
  kind: "focus" | "reveal"
  plotId: string
}

interface MapShellProps {
  layout: Layout
  branding: Branding
}

/** Space kept clear around the map for the floating controls, in pixels. */
const EDGE = 16
/** The filter row under the top bar. */
const FILTER_ROW = 44
/** Desktop detail panel width. The reserve flow gets more room: 40% of the window, within these bounds. */
const PANEL_WIDTH = 360
const FLOW_PANEL_MAX = 480
const FLOW_PANEL_SHARE = 0.4
/** A focused plot's short side on screen, in pixels: big enough to see, small enough to keep its neighbours. */
const PLOT_FOCUS_SIZE = 32
/** On-screen plot size (px) below which plots are specks: glyphs are hidden. */
const ZOOM_FAR_BELOW = 7
/** On-screen plot size (px) from which plot numbers fit inside plots. */
const ZOOM_NEAR_FROM = 24
/** The arrival sequence plays once per browser session. */
const ARRIVAL_KEY = "plotview:arrived"
const ARRIVAL_MS = 2200
/** How long the reserved plot's ink fill plays, matching motion.css. */
const INK_MS = 1600

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
export function MapShell({ layout: sourceLayout, branding }: MapShellProps) {
  const storedView = useAppState((state) => state.view)
  const availableOnly = useAppState((state) => state.availableOnly)
  const selectedPlotId = useAppState((state) => state.selectedPlotId)
  const selectedPackageId = useAppState((state) => state.selectedPackageId)
  const reservation = useAppState((state) => state.reservation)
  const reservations = useAppState((state) => state.reservations)
  // The layout as this visitor sees it: plots they reserved show as reserved everywhere.
  const layout = useMemo(
    () => withReservations(sourceLayout, new Set(reservations.map((item) => item.plotId))),
    [sourceLayout, reservations],
  )
  const buyer = useAppState((state) => state.buyer)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [sheetHeight, setSheetHeight] = useState(0)

  const hasSiteMap = layout.grounds.length + layout.paths.length + layout.landmarks.length > 0
  const view: MapView = hasSiteMap ? storedView : "grid"

  const [viewportRef, viewportSize] = useElementSize<HTMLDivElement>()
  const [topBarRef, topBarSize] = useElementSize<HTMLDivElement>()

  // The controls always float over these edges.
  const baseInsets = useMemo<Insets>(
    () => ({ top: topBarSize.height + FILTER_ROW + EDGE * 1.5, right: EDGE, bottom: EDGE, left: EDGE }),
    [topBarSize.height],
  )
  // The detail panel or sheet covers more while a plot is selected; the camera keeps plots out from under it.
  const panelOpen = selectedPlotId !== null
  // While reserving on a wide screen the panel widens and runs full height, and
  // the search card and filters step aside: nobody searches mid-checkout.
  const reservingOnDesktop = isDesktop && reservation !== null && reservation.plotId === selectedPlotId
  const panelWidth = reservingOnDesktop
    ? Math.round(Math.min(Math.max(viewportSize.width * FLOW_PANEL_SHARE, PANEL_WIDTH), FLOW_PANEL_MAX))
    : PANEL_WIDTH
  const panelSpace = panelWidth + EDGE * 2
  const insets = useMemo<Insets>(
    () => ({
      ...baseInsets,
      left: panelOpen && isDesktop ? panelSpace : baseInsets.left,
      bottom: panelOpen && !isDesktop && sheetHeight > 0 ? sheetHeight + EDGE : baseInsets.bottom,
    }),
    [baseInsets, panelOpen, isDesktop, panelSpace, sheetHeight],
  )
  const viewport = useMemo<Viewport>(
    () => ({ width: viewportSize.width, height: viewportSize.height, insets }),
    [viewportSize.width, viewportSize.height, insets],
  )

  // Grid blocks re-flow to the visible area's shape; rounded so tiny resizes do not re-flow.
  // Measured without the panel, so opening it never reshuffles the sections.
  const visibleWidth = viewport.width - baseInsets.left - baseInsets.right
  const visibleHeight = viewport.height - baseInsets.top - baseInsets.bottom
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
  // What the map's shape depends on. Status changes (a plot becoming reserved) rebuild the
  // geometry too, but must not move the camera, so the camera compares this key instead.
  const geometryKey = view === "grid" ? `grid:${gridAspect}` : "sitemap"
  const lastGeometryKey = useRef<string | null>(null)
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
    const firstFrame = lastGeometryKey.current === null
    const geometryChanged = lastGeometryKey.current !== geometryKey
    lastGeometryKey.current = geometryKey

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
      } else if (!geometryChanged && !api.hasUserMoved() && !getAppState().selectedPlotId) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- geometry is read fresh; the key decides when to move
  }, [geometryKey, viewport])

  const selectedPackage = layout.packages.find((pkg) => pkg.id === selectedPackageId) ?? layout.packages[0]

  const detailsModel = useMemo<PlotDetailsModel | null>(() => {
    const selected = selectedPlotId ? plotsById.get(selectedPlotId) : undefined
    if (!selected) {
      return null
    }
    // The closest reservable plot on the current map, offered when this one is taken.
    let nearestAvailable: PlotDetailsModel["nearestAvailable"] = null
    const origin = geometry.plotBounds.get(selected.plot.id)
    if (selected.plot.status !== "available" && origin) {
      const [originX, originY] = rectCenter(origin)
      let bestDistance = Infinity
      for (const [id, entry] of plotsById) {
        const bounds = geometry.plotBounds.get(id)
        if (entry.plot.status !== "available" || !bounds) {
          continue
        }
        const [x, y] = rectCenter(bounds)
        const distance = Math.hypot(x - originX, y - originY)
        if (distance < bestDistance) {
          bestDistance = distance
          nearestAvailable = entry
        }
      }
    }
    const ownReservation = reservations.find((item) => item.plotId === selected.plot.id) ?? null
    return { ...selected, packages: layout.packages, currency: layout.site.currency, nearestAvailable, ownReservation }
  }, [selectedPlotId, plotsById, geometry, layout, reservations])

  // Camera moves that follow a selection wait for the render that opens the
  // panel or sheet, so they aim at the space actually left free and nothing
  // started a moment earlier cancels them.
  const [cameraRequest, setCameraRequest] = useState<CameraRequest | null>(null)
  const handledRequest = useRef<CameraRequest | null>(null)

  // When the covered area changes on its own (the sheet settles, the window resizes),
  // keep the selected plot out from under the panel or sheet.
  useEffect(() => {
    if (cameraRequest && handledRequest.current !== cameraRequest) {
      return
    }
    const plotId = getAppState().selectedPlotId
    const bounds = plotId ? geometry.plotBounds.get(plotId) : undefined
    if (bounds && viewport.width > 0) {
      camera.current?.reveal(bounds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the covered area changes
  }, [insets.left, insets.bottom])

  useEffect(() => {
    if (!cameraRequest || handledRequest.current === cameraRequest) {
      return
    }
    handledRequest.current = cameraRequest
    const bounds = geometry.plotBounds.get(cameraRequest.plotId)
    if (!bounds) {
      return
    }
    if (cameraRequest.kind === "focus") {
      camera.current?.focus(bounds, { targetSize: PLOT_FOCUS_SIZE })
    } else {
      camera.current?.reveal(bounds)
    }
  }, [cameraRequest, geometry])

  function handleViewPlot(plotId: string) {
    appActions.selectPlot(plotId)
    setTabStopPlotId(plotId)
    setCameraRequest({ kind: "focus", plotId })
  }

  // Back from the confirmation: the flow closes, the plot stays selected, and its
  // new status spreads through it like ink.
  const [inkPlotId, setInkPlotId] = useState<string | null>(null)
  useEffect(() => {
    if (!inkPlotId) {
      return
    }
    const timer = window.setTimeout(() => setInkPlotId(null), INK_MS)
    return () => window.clearTimeout(timer)
  }, [inkPlotId])

  function handleBackToMap() {
    const plotId = getAppState().reservation?.plotId
    appActions.endReservation()
    if (plotId) {
      setInkPlotId(plotId)
      setCameraRequest({ kind: "reveal", plotId })
    }
  }

  function handleReserve() {
    const plotId = getAppState().selectedPlotId
    if (plotId) {
      appActions.startReservation(plotId)
    }
  }

  // Warm the deferred chunks once the page is idle, so the first selection or view switch never waits.
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(prefetchDeferredParts, { timeout: 3000 })
      return () => window.cancelIdleCallback(handle)
    }
    const timer = setTimeout(prefetchDeferredParts, 1500)
    return () => clearTimeout(timer)
  }, [])

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
    if (next === view || !api || viewport.width === 0 || prefersReducedMotion() || !morphOverlayLoaded) {
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
    if (!deselect) {
      setCameraRequest({ kind: "reveal", plotId })
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
      setTabStopPlotId(result.plot.id)
      setCameraRequest({ kind: "focus", plotId: result.plot.id })
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
            inkPlotId={inkPlotId}
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
          inert={reservingOnDesktop || undefined}
          className={cn(
            "relative z-20 col-span-2 transition-opacity duration-300 ease-standard md:col-span-1",
            reservingOnDesktop && "pointer-events-none opacity-0",
          )}
        />
        <div
          inert={reservingOnDesktop || undefined}
          className={cn(
            "col-start-1 row-start-2 flex flex-wrap items-start gap-2 transition-opacity duration-300 ease-standard md:col-span-2",
            reservingOnDesktop && "pointer-events-none opacity-0",
          )}
        >
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

      <div
        style={isDesktop ? { left: panelOpen ? panelSpace : EDGE } : undefined}
        className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-10 transition-[left] duration-300 ease-standard md:bottom-4"
      >
        <SampleDataBadge />
      </div>

      {isDesktop ? (
        <DetailPanel
          model={detailsModel}
          selectedPackage={selectedPackage}
          reservation={reservation}
          buyer={buyer}
          width={panelWidth}
          top={reservingOnDesktop ? EDGE : baseInsets.top - EDGE / 2}
          fullHeight={reservingOnDesktop}
          onSelectPackage={appActions.selectPackage}
          onViewPlot={handleViewPlot}
          onReserve={handleReserve}
          onBackToMap={handleBackToMap}
          onClose={() => appActions.selectPlot(null)}
        />
      ) : (
        <BottomSheet
          model={detailsModel}
          selectedPackage={selectedPackage}
          reservation={reservation}
          buyer={buyer}
          viewportHeight={viewport.height}
          onSelectPackage={appActions.selectPackage}
          onViewPlot={handleViewPlot}
          onReserve={handleReserve}
          onBackToMap={handleBackToMap}
          onClose={() => appActions.selectPlot(null)}
          onHeightChange={setSheetHeight}
        />
      )}

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
