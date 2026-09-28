import type { Package } from "@/types/layout"
import { PackagePicker } from "./PackagePicker"
import type { PlotDetailsModel } from "./types"
import { UnavailableNote } from "./UnavailableNote"

interface PlotDetailsBodyProps {
  model: PlotDetailsModel
  selectedPackage: Package
  onSelectPackage: (packageId: string) => void
  onViewPlot: (plotId: string) => void
}

/** Package choice for an available plot; otherwise why it is unavailable and where to look instead. */
export function PlotDetailsBody({ model, selectedPackage, onSelectPackage, onViewPlot }: PlotDetailsBodyProps) {
  const { plot, packages, currency, nearestAvailable } = model
  if (plot.status === "available") {
    return (
      <PackagePicker
        packages={packages}
        basePrice={plot.basePrice}
        currency={currency}
        selectedId={selectedPackage.id}
        onSelect={onSelectPackage}
      />
    )
  }
  return (
    <UnavailableNote
      status={plot.status}
      nearest={nearestAvailable}
      fromMultiplier={Math.min(...packages.map((pkg) => pkg.priceMultiplier))}
      currency={currency}
      onViewPlot={onViewPlot}
    />
  )
}
