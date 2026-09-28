"use client"

import { useLayoutEffect, useRef } from "react"
import { cn } from "@/lib/cn"
import { screenPlotTransform, type ScreenPlot } from "./morph"
import { STATUS_FILL_CLASS, STATUS_STROKE_CLASS } from "./plotVisuals"

export interface MorphPlan {
  from: Map<string, ScreenPlot>
  to: Map<string, ScreenPlot>
  dimmed: Set<string>
}

interface MorphOverlayProps {
  plan: MorphPlan
  onDone: () => void
}

const DURATION_MS = 850
const EASING = "cubic-bezier(0.65, 0, 0.35, 1)"
/** Each section starts a little after the one before it, so the move ripples through the site. */
const SECTION_STAGGER_MS = 45

/**
 * Flies every plot from where it sits in the old view to where it will sit in
 * the new one, in screen space, while the map underneath switches views. The
 * same plots visibly travel into their real positions on the site (or back
 * into their rows), which shows the two views are one set of plots.
 *
 * Driven by the Web Animations API: one compositor-friendly transform animation
 * per plot and no React renders per frame.
 */
export function MorphOverlay({ plan, onDone }: MorphOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const onDoneRef = useRef(onDone)

  useLayoutEffect(() => {
    onDoneRef.current = onDone
  })

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) {
      return
    }
    const animations: Animation[] = []
    for (const element of svg.querySelectorAll<SVGRectElement>("rect[data-morph-id]")) {
      const id = element.dataset.morphId ?? ""
      const from = plan.from.get(id)
      const to = plan.to.get(id)
      if (!from || !to) {
        continue
      }
      animations.push(
        element.animate([{ transform: screenPlotTransform(from) }, { transform: screenPlotTransform(to) }], {
          duration: DURATION_MS,
          delay: to.order * SECTION_STAGGER_MS,
          easing: EASING,
          fill: "both",
        }),
      )
    }
    let cancelled = false
    Promise.all(animations.map((animation) => animation.finished))
      .then(() => {
        if (!cancelled) {
          onDoneRef.current()
        }
      })
      .catch(() => {
        // An animation is cancelled when a new morph replaces this one; that one reports instead.
      })
    return () => {
      cancelled = true
      animations.forEach((animation) => animation.cancel())
    }
  }, [plan])

  return (
    <svg ref={svgRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[5] h-full w-full overflow-visible">
      {[...plan.to.values()].map((plot) => {
        const from = plan.from.get(plot.id)
        return (
          <rect
            key={plot.id}
            data-morph-id={plot.id}
            x={-0.5}
            y={-0.5}
            width={1}
            height={1}
            rx={0.16}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            style={{ transform: from ? screenPlotTransform(from) : screenPlotTransform(plot), transformOrigin: "0 0" }}
            className={cn(
              STATUS_FILL_CLASS[plot.status],
              STATUS_STROKE_CLASS[plot.status],
              plan.dimmed.has(plot.id) && "opacity-25",
            )}
          />
        )
      })}
    </svg>
  )
}
