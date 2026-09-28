import { SECTION_RADIUS } from "../plotVisuals"
import { GRID_PLOT_GAP, GRID_PLOT_SIZE, GRID_SECTION_HEADER_HEIGHT, GRID_SECTION_PADDING } from "./gridLayout"
import { PlotRect } from "./PlotRect"
import type { Section } from "@/types/layout"

interface SectionBlockProps {
  section: Section
  width: number
  height: number
  selectedPlotId: string | null
  availableOnly: boolean
  onSelectPlot: (plotId: string) => void
}

export function SectionBlock({ section, width, height, selectedPlotId, availableOnly, onSelectPlot }: SectionBlockProps) {
  return (
    <g>
      <rect
        width={width}
        height={height}
        rx={SECTION_RADIUS}
        className="fill-surface-raised stroke-border-neutral"
        strokeWidth={1}
      />
      <text x={GRID_SECTION_PADDING} y={GRID_SECTION_PADDING + 12} className="fill-foreground text-[11px] font-medium">
        {section.name}
      </text>
      {section.plots.map((plot) => {
        const plotX = GRID_SECTION_PADDING + (plot.col - 1) * (GRID_PLOT_SIZE + GRID_PLOT_GAP)
        const plotY =
          GRID_SECTION_HEADER_HEIGHT + GRID_SECTION_PADDING + (plot.row - 1) * (GRID_PLOT_SIZE + GRID_PLOT_GAP)
        return (
          <PlotRect
            key={plot.id}
            plot={plot}
            x={plotX}
            y={plotY}
            size={GRID_PLOT_SIZE}
            isSelected={plot.id === selectedPlotId}
            isDimmed={availableOnly && plot.status !== "available"}
            onSelect={onSelectPlot}
          />
        )
      })}
    </g>
  )
}
