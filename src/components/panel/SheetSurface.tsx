"use client"

import { X } from "lucide-react"
import { animate, m, useMotionValue } from "motion/react"
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent } from "react"
import { ReserveFlow } from "@/components/reserve/ReserveFlow"
import { IconButton } from "@/components/ui/IconButton"
import type { BuyerDetails, Reservation } from "@/lib/store"
import type { Package } from "@/types/layout"
import { PlotDetailsBody } from "./PlotDetailsBody"
import { PlotSummary } from "./PlotSummary"
import { ReserveBar } from "./ReserveBar"
import { useReturnedFromFlow } from "./useReturnedFromFlow"
import type { PlotDetailsModel } from "./types"

type Snap = "peek" | "half" | "full"

export interface SheetSurfaceProps {
  model: PlotDetailsModel
  selectedPackage: Package
  reservation: Reservation | null
  buyer: BuyerDetails
  viewportHeight: number
  onSelectPackage: (packageId: string) => void
  onViewPlot: (plotId: string) => void
  onReserve: () => void
  onBackToMap: () => void
  onClose: () => void
  /** The sheet's resting height, so the map can keep the plot visible above it. */
  onHeightChange: (height: number) => void
}

const HALF_SHARE = 0.56
const FULL_GAP = 64
/** Pointer travel (px) before a press on the header counts as a drag. */
const DRAG_THRESHOLD = 4
/** How far ahead (ms) a flick's velocity is projected when choosing where to settle. */
const PROJECTION_MS = 180
const SPRING = { type: "spring", bounce: 0, duration: 0.38 } as const

interface DragState {
  startY: number
  startHeight: number
  moved: boolean
  samples: { y: number; t: number }[]
}

/**
 * The phone's bottom sheet. It rests at peek (just the plot), half (packages
 * and the reserve button) or full height, follows the finger while dragged by
 * its header, and on release settles where the flick was heading. Flicking it
 * down from peek closes it.
 */
export function SheetSurface({
  model,
  selectedPackage,
  reservation,
  buyer,
  viewportHeight,
  onSelectPackage,
  onViewPlot,
  onReserve,
  onBackToMap,
  onClose,
  onHeightChange,
}: SheetSurfaceProps) {
  const headingId = useId()
  // Forms need the room: while reserving, the sheet stays at full height.
  const reserving = reservation?.plotId === model.plot.id
  const returnedFromFlow = useReturnedFromFlow(model.plot.id, reserving)
  const headerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [peekHeight, setPeekHeight] = useState(128)
  const [contentHeight, setContentHeight] = useState(Infinity)
  const [snap, setSnap] = useState<Snap>("half")
  const heights: Record<Snap, number> = {
    peek: peekHeight,
    // Half is at most a little over half the screen, and no taller than the content needs.
    half: Math.max(Math.min(Math.round(viewportHeight * HALF_SHARE), contentHeight), peekHeight + 96),
    full: Math.max(viewportHeight - FULL_GAP, peekHeight),
  }
  const heightsRef = useRef(heights)
  const height = useMotionValue(heights.half)
  const drag = useRef<DragState | null>(null)
  const onHeightChangeRef = useRef(onHeightChange)

  useLayoutEffect(() => {
    heightsRef.current = heights
    onHeightChangeRef.current = onHeightChange
  })

  // Peek shows exactly the header; half fits short content (an unavailable plot) snugly.
  useLayoutEffect(() => {
    const header = headerRef.current
    if (!header) {
      return
    }
    const peek = Math.ceil(header.getBoundingClientRect().height)
    // The scroll area stretches to fill the sheet, so measure what is inside it.
    const bodyElement = bodyRef.current
    const bodyPadding = bodyElement ? parseFloat(getComputedStyle(bodyElement).paddingBottom) : 0
    const body = (bodyElement?.firstElementChild?.getBoundingClientRect().height ?? 0) + bodyPadding
    const footer = footerRef.current?.getBoundingClientRect().height ?? 0
    setPeekHeight(peek)
    setContentHeight(Math.ceil(peek + body + footer))
  }, [model.plot.id])

  const springTo = useCallback(
    (target: Snap, velocity = 0) => {
      const to = heightsRef.current[target]
      animate(height, to, { ...SPRING, velocity }).then(() => onHeightChangeRef.current(to))
    },
    [height],
  )

  function settle(target: Snap, velocity = 0) {
    setSnap(target)
    springTo(target, velocity)
  }

  // Re-settle when the resting heights change (rotation, resize, new header).
  useEffect(() => {
    springTo(snap)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the snap heights move
  }, [heights.peek, heights.half, heights.full, springTo])

  // Entering the reserve flow opens the sheet fully; leaving it returns to half.
  const [wasReserving, setWasReserving] = useState(reserving)
  if (reserving !== wasReserving) {
    setWasReserving(reserving)
    setSnap(reserving ? "full" : "half")
  }
  useEffect(() => {
    springTo(reserving ? "full" : "half")
  }, [reserving, springTo])

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest("button"))) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      startY: event.clientY,
      startHeight: height.get(),
      moved: false,
      samples: [{ y: event.clientY, t: event.timeStamp }],
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state) {
      return
    }
    const rise = state.startY - event.clientY
    if (Math.abs(rise) > DRAG_THRESHOLD) {
      state.moved = true
    }
    height.set(Math.min(Math.max(state.startHeight + rise, 40), heights.full))
    state.samples.push({ y: event.clientY, t: event.timeStamp })
    if (state.samples.length > 6) {
      state.samples.shift()
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current
    drag.current = null
    if (!state?.moved) {
      return
    }
    event.currentTarget.releasePointerCapture(event.pointerId)
    const first = state.samples[0]
    const last = state.samples[state.samples.length - 1]
    const elapsed = Math.max(last.t - first.t, 1)
    // Positive when moving up, in px per ms.
    const velocity = (first.y - last.y) / elapsed
    const projected = height.get() + velocity * PROJECTION_MS

    if (reserving) {
      // Only a deliberate pull closes the flow; anything less springs back to full.
      if (projected < heights.full * 0.5) {
        onClose()
      } else {
        settle("full", velocity * 1000)
      }
      return
    }
    if (projected < heights.peek * 0.55) {
      onClose()
      return
    }
    const target = (Object.keys(heights) as Snap[]).reduce((best, key) =>
      Math.abs(heights[key] - projected) < Math.abs(heights[best] - projected) ? key : best,
    )
    settle(target, velocity * 1000)
  }

  const expanded = snap === "full"

  return (
    <m.section
      data-plot-details=""
      aria-labelledby={headingId}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%", transition: { duration: 0.22, ease: [0.3, 0, 1, 1] } }}
      transition={SPRING}
      style={{ height }}
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-2xl bg-surface shadow-sheet ring-1 ring-inset ring-line-subtle"
    >
      {reserving && reservation ? (
        <>
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="shrink-0 cursor-grab touch-none pt-1 select-none active:cursor-grabbing"
          >
            <span aria-hidden="true" className="mx-auto flex h-5 w-16 items-center justify-center">
              <span className="h-1 w-10 rounded-full bg-line" />
            </span>
          </div>
          <ReserveFlow
            model={model}
            reservation={reservation}
            buyer={buyer}
            selectedPackage={selectedPackage}
            onSelectPackage={onSelectPackage}
            onBackToMap={onBackToMap}
            onClose={onClose}
          />
        </>
      ) : (
        <>
        <div
          ref={headerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="shrink-0 cursor-grab touch-none px-5 pb-4 select-none active:cursor-grabbing"
        >
          <button
            type="button"
            aria-label={expanded ? "Show less" : "Show more"}
            aria-expanded={snap !== "peek"}
            onClick={() => settle(snap === "peek" ? "half" : snap === "half" ? "full" : "half")}
            className="mx-auto flex h-6 w-16 items-center justify-center"
          >
            <span className="h-1 w-10 rounded-full bg-line" />
          </button>
          <div className="flex items-start gap-3">
            <PlotSummary plot={model.plot} section={model.section} headingId={headingId} />
            <IconButton
              label="Close plot details"
              variant="ghost"
              size="sm"
              icon={<X aria-hidden="true" className="size-4" />}
              onClick={onClose}
              className="-mr-1 ml-auto"
            />
          </div>
        </div>
        <m.div
          key={model.plot.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
            <PlotDetailsBody
              model={model}
              selectedPackage={selectedPackage}
              onSelectPackage={onSelectPackage}
              onViewPlot={onViewPlot}
            />
          </div>
          {model.plot.status === "available" && (
            <div
              ref={footerRef}
              className="shrink-0 border-t border-line-subtle px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <ReserveBar
                pkg={selectedPackage}
                price={model.plot.basePrice * selectedPackage.priceMultiplier}
                currency={model.currency}
                onReserve={onReserve}
                focusOnMount={returnedFromFlow}
              />
            </div>
          )}
        </m.div>
        </>
      )}
    </m.section>
  )
}
