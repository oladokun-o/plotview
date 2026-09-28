"use client"

import { ChevronDown } from "lucide-react"
import { useId, useState } from "react"
import { Surface } from "@/components/ui/Surface"
import { cn } from "@/lib/cn"
import type { PlotStatus } from "@/types/layout"
import { PLOT_STATUS_LABEL, PLOT_STATUSES, STATUS_FILL_CLASS, STATUS_STROKE_CLASS } from "./plotVisuals"
import { PlotStatusGlyph } from "./PlotStatusGlyph"

interface LegendProps {
  counts: Record<PlotStatus, number>
}

const SWATCH = { width: 12, height: 18 }

/**
 * What each plot style means, with live counts. Always visible on wide screens;
 * on a phone it folds into a single button to leave room for the map.
 */
export function Legend({ counts }: LegendProps) {
  const [open, setOpen] = useState(false)
  const listId = useId()

  return (
    <Surface className="pointer-events-auto flex flex-col md:flex-row md:items-center">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium text-primary md:hidden"
      >
        Legend
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 text-secondary transition-transform duration-200 ease-standard", open && "rotate-180")}
        />
      </button>
      <ul
        id={listId}
        className={cn(
          "flex-col gap-2 px-3.5 pb-3 text-sm md:flex md:h-9 md:flex-row md:items-center md:gap-4 md:pb-0",
          open ? "flex" : "hidden",
        )}
      >
        {PLOT_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-2">
            <svg width={SWATCH.width} height={SWATCH.height} aria-hidden="true" className="shrink-0">
              <rect
                x={0.5}
                y={0.5}
                width={SWATCH.width - 1}
                height={SWATCH.height - 1}
                rx={2.5}
                className={cn(STATUS_FILL_CLASS[status], STATUS_STROKE_CLASS[status])}
              />
              <PlotStatusGlyph status={status} width={SWATCH.width} height={SWATCH.height} />
            </svg>
            <span className="text-primary">{PLOT_STATUS_LABEL[status]}</span>
            <span className="text-tertiary tabular-nums">{counts[status]}</span>
          </li>
        ))}
      </ul>
    </Surface>
  )
}
