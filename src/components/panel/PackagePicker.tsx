import { useId } from "react"
import type { Package } from "@/types/layout"
import { PackageOption } from "./PackageOption"

interface PackagePickerProps {
  packages: Package[]
  basePrice: number
  currency: string
  selectedId: string
  onSelect: (packageId: string) => void
  /** Hide the visible "Choose a package" line when a step heading already says it. */
  hideLegend?: boolean
}

/** The ways this plot can be reserved, each with its price for this plot. */
export function PackagePicker({ packages, basePrice, currency, selectedId, onSelect, hideLegend }: PackagePickerProps) {
  const name = useId()
  const labelId = useId()

  return (
    <fieldset aria-labelledby={labelId}>
      <div className="flex items-baseline justify-between gap-3">
        <legend id={labelId} className={hideLegend ? "sr-only" : "text-sm font-medium text-primary"}>
          Choose a package
        </legend>
        <span className="text-xs text-tertiary">Sample prices</span>
      </div>
      <div className="mt-3 space-y-2">
        {packages.map((pkg) => (
          <PackageOption
            key={pkg.id}
            pkg={pkg}
            name={name}
            price={basePrice * pkg.priceMultiplier}
            currency={currency}
            checked={pkg.id === selectedId}
            onSelect={() => onSelect(pkg.id)}
          />
        ))}
      </div>
    </fieldset>
  )
}
