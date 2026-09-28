"use client"

import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"
import { computeGridLayout } from "./gridLayout"
import { SectionBlock } from "./SectionBlock"
import type { Section } from "@/types/layout"

interface GridViewProps {
  sections: Section[]
  selectedPlotId: string | null
  availableOnly: boolean
  onSelectPlot: (plotId: string) => void
}

export function GridView({ sections, selectedPlotId, availableOnly, onSelectPlot }: GridViewProps) {
  const layout = computeGridLayout(sections)

  return (
    <TransformWrapper minScale={0.5} maxScale={4} fitOnInit centerOnInit doubleClick={{ disabled: true }}>
      <TransformComponent
        wrapperStyle={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        contentStyle={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="h-full w-full"
          role="group"
          aria-label="Cemetery plot grid"
        >
          {layout.sections.map((box) => (
            <g key={box.section.id} transform={`translate(${box.x}, ${box.y})`}>
              <SectionBlock
                section={box.section}
                width={box.width}
                height={box.height}
                selectedPlotId={selectedPlotId}
                availableOnly={availableOnly}
                onSelectPlot={onSelectPlot}
              />
            </g>
          ))}
        </svg>
      </TransformComponent>
    </TransformWrapper>
  )
}
