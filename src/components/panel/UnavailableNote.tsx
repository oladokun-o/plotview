import { ArrowRight } from "lucide-react"
import { formatPrice } from "@/lib/format"
import type { Plot, PlotStatus, Section } from "@/types/layout"

interface UnavailableNoteProps {
  status: Exclude<PlotStatus, "available">
  nearest: { plot: Plot; section: Section } | null
  fromMultiplier: number
  currency: string
  onViewPlot: (plotId: string) => void
}

const MESSAGE: Record<UnavailableNoteProps["status"], string> = {
  reserved: "This plot is being held for a family and cannot be reserved.",
  occupied: "This plot is occupied and cannot be reserved.",
}

/** Why a plot cannot be reserved, and the closest one that can, so the search never dead-ends. */
export function UnavailableNote({ status, nearest, fromMultiplier, currency, onViewPlot }: UnavailableNoteProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-secondary">{MESSAGE[status]}</p>
      {nearest && (
        <div>
          <p className="text-xs font-medium text-tertiary">Nearest available plot</p>
          <button
            type="button"
            onClick={() => onViewPlot(nearest.plot.id)}
            className="group mt-2 flex w-full items-center gap-3 rounded-md bg-surface p-3 text-left ring-1 ring-inset ring-line-subtle transition-colors duration-150 hover:bg-sunken"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-primary">Plot {nearest.plot.id}</span>
              <span className="mt-0.5 block text-xs text-secondary tabular-nums">
                {nearest.section.name} · from {formatPrice(nearest.plot.basePrice * fromMultiplier, currency)}
              </span>
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-accent-text">
              View
              <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
