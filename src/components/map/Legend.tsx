import { PLOT_STATUS_LABEL, STATUS_FILL_CLASS } from "./plotVisuals"
import { PlotStatusGlyph } from "./PlotStatusGlyph"
import type { PlotStatus } from "@/types/layout"

const STATUSES: PlotStatus[] = ["available", "reserved", "occupied"]
const SWATCH_SIZE = 14

export function Legend() {
  return (
    <ul className="flex flex-wrap gap-4 text-xs text-foreground/70">
      {STATUSES.map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <svg width={SWATCH_SIZE} height={SWATCH_SIZE} aria-hidden="true">
            <rect
              width={SWATCH_SIZE}
              height={SWATCH_SIZE}
              rx={3}
              className={[STATUS_FILL_CLASS[status], "stroke-border-neutral stroke-1"].join(" ")}
            />
            <PlotStatusGlyph status={status} size={SWATCH_SIZE} />
          </svg>
          <span>{PLOT_STATUS_LABEL[status]}</span>
        </li>
      ))}
    </ul>
  )
}
