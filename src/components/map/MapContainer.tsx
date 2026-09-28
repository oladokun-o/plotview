"use client"

import { useState } from "react"
import { SampleDataBadge } from "@/components/SampleDataBadge"
import type { Layout } from "@/types/layout"
import { AvailableOnlyToggle } from "./AvailableOnlyToggle"
import { GridView } from "./grid/GridView"
import { Legend } from "./Legend"

interface MapContainerProps {
  layout: Layout
}

export function MapContainer({ layout }: MapContainerProps) {
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null)
  const [availableOnly, setAvailableOnly] = useState(false)

  function handleSelectPlot(plotId: string) {
    setSelectedPlotId((current) => (current === plotId ? null : plotId))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border-neutral">
        <header className="mx-auto flex w-full max-w-5xl items-start justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{layout.site.name}</h1>
            <p className="mt-0.5 text-sm text-foreground/60">A place of rest, chosen with care.</p>
          </div>
          <SampleDataBadge />
        </header>
      </div>
      <div className="border-b border-border-neutral">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Legend />
          <AvailableOnlyToggle checked={availableOnly} onChange={setAvailableOnly} />
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <GridView
          sections={layout.sections}
          selectedPlotId={selectedPlotId}
          availableOnly={availableOnly}
          onSelectPlot={handleSelectPlot}
        />
      </div>
    </div>
  )
}
