import { LayoutGrid } from "lucide-react"
import { cn } from "@/lib/cn"
import type { SearchResult } from "@/lib/search"
import { PLOT_STATUS_LABEL, STATUS_FILL_CLASS, STATUS_STROKE_CLASS } from "./plotVisuals"
import { PlotStatusGlyph } from "./PlotStatusGlyph"

interface SearchResultOptionProps {
  id: string
  result: SearchResult
  active: boolean
  onPick: () => void
  onHover: () => void
}

export function SearchResultOption({ id, result, active, onPick, onHover }: SearchResultOptionProps) {
  const title = result.kind === "plot" ? `Plot ${result.plot.id}` : result.section.name
  const subtitle =
    result.kind === "plot"
      ? `${result.section.name} · ${PLOT_STATUS_LABEL[result.plot.status]}`
      : `Section ${result.section.id} · ${result.availableCount} available`

  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      // Keep focus in the input so the list does not close before the pick registers.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPick}
      onMouseMove={onHover}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2",
        active ? "bg-sunken" : "bg-transparent",
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-sunken ring-1 ring-inset ring-line-subtle">
        {result.kind === "plot" ? (
          <svg width={12} height={18} aria-hidden="true">
            <rect
              x={0.5}
              y={0.5}
              width={11}
              height={17}
              rx={2.5}
              className={cn(STATUS_FILL_CLASS[result.plot.status], STATUS_STROKE_CLASS[result.plot.status])}
            />
            <PlotStatusGlyph status={result.plot.status} width={12} height={18} />
          </svg>
        ) : (
          <LayoutGrid aria-hidden="true" className="size-4 text-secondary" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-primary">{title}</span>
        <span className="block truncate text-xs text-secondary">{subtitle}</span>
      </span>
    </li>
  )
}
