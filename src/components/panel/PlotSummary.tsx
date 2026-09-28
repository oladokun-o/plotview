import { Badge } from "@/components/ui/Badge"
import { PLOT_STATUS_LABEL } from "@/components/map/plotVisuals"
import type { Plot, Section } from "@/types/layout"

interface PlotSummaryProps {
  plot: Plot
  section: Section
  headingId: string
}

/** Which plot this is and where: the panel's heading. */
export function PlotSummary({ plot, section, headingId }: PlotSummaryProps) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-tertiary">
        {section.name} · Section {section.id}
      </p>
      <h2 id={headingId} className="mt-0.5 font-display text-2xl leading-tight text-primary">
        Plot {plot.id}
      </h2>
      <div className="mt-2 flex items-center gap-2">
        <Badge tone={plot.status}>{PLOT_STATUS_LABEL[plot.status]}</Badge>
        <span className="text-xs text-secondary tabular-nums">
          Row {plot.row} · Column {plot.col}
        </span>
      </div>
    </div>
  )
}
