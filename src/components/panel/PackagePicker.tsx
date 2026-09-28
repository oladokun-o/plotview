import { useId } from "react"
import type { Package } from "@/types/layout"
import { PackageOption } from "./PackageOption"

interface PackagePickerProps {
  packages: Package[]
  basePrice: number
  currency: string
  selectedId: string
  onSelect: (packageId: string) => void
}

/** The ways this plot can be reserved, each with its price for this plot. */
export function PackagePicker({ packages, basePrice, currency, selectedId, onSelect }: PackagePickerProps) {
  const name = useId()
  const labelId = useId()

  return (
    <fieldset aria-labelledby={labelId}>
      <div className="flex items-baseline justify-between gap-3">
        <legend id={labelId} className="text-sm font-medium text-primary">
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
