"use client"

import { useLayoutEffect, useRef, useState, type RefObject } from "react"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/cn"
import { formatPrice } from "@/lib/format"
import type { Plot, Section } from "@/types/layout"
import { PLOT_STATUS_LABEL } from "./plotVisuals"

export interface TooltipTarget {
  plot: Plot
  section: Section
}

interface PlotTooltipProps {
  target: TooltipTarget | null
  /** Lowest price a plot can be bought at, as a multiple of its base price. */
  fromMultiplier: number
  currency: string
  sceneRef: RefObject<SVGSVGElement | null>
  /** Registers a callback for every pan/zoom frame; returns an unsubscribe function. */
  subscribeTransform: (listener: () => void) => () => void
  /** Pixels at the top of the screen covered by floating controls. */
  topLimit: number
}

const GAP = 10
const EDGE = 12

interface Position {
  left: number
  top: number
}

/**
 * Plot id, status and section, floating next to the hovered or keyboard-focused
 * plot. It follows the plot while the map pans or zooms and flips below the plot
 * when there is no room above.
 */
export function PlotTooltip({
  target,
  fromMultiplier,
  currency,
  sceneRef,
  subscribeTransform,
  topLimit,
}: PlotTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const plotId = target?.plot.id ?? null

  useLayoutEffect(() => {
    if (!plotId) {
      return
    }
    let frame = 0
    const place = () => {
      const anchor = sceneRef.current?.querySelector(`[data-plot-id="${plotId}"] rect`)
      const tooltip = tooltipRef.current
      if (!anchor || !tooltip) {
        return
      }
      const rect = anchor.getBoundingClientRect()
      const { width, height } = tooltip.getBoundingClientRect()
      const above = rect.top - GAP - height
      const top = above < topLimit ? rect.bottom + GAP : above
      const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, EDGE), window.innerWidth - width - EDGE)
      setPosition({ left, top })
    }
    place()
    const unsubscribe = subscribeTransform(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(place)
    })
    return () => {
      cancelAnimationFrame(frame)
      unsubscribe()
      setPosition(null)
    }
  }, [plotId, sceneRef, subscribeTransform, topLimit])

  if (!target) {
    return null
  }

  const { plot, section } = target
  return (
    <div
      ref={tooltipRef}
      role="tooltip"
      style={position ?? { left: 0, top: 0 }}
      className={cn(
        "pointer-events-none fixed z-30 min-w-44 rounded-md bg-surface px-3 py-2.5 shadow-float ring-1 ring-inset ring-line-subtle",
        "transition-opacity duration-150 ease-standard",
        position ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-primary tabular-nums">Plot {plot.id}</span>
        <Badge tone={plot.status}>{PLOT_STATUS_LABEL[plot.status]}</Badge>
      </div>
      <p className="mt-1 text-xs text-secondary">
        {section.name} · Row {plot.row}
      </p>
      {plot.status === "available" && (
        <p className="mt-1.5 text-xs text-primary tabular-nums">
          From {formatPrice(plot.basePrice * fromMultiplier, currency)}
        </p>
      )}
    </div>
  )
}
