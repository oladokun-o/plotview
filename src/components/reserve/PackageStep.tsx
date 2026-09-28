import { PackagePicker } from "@/components/panel/PackagePicker"
import type { Package, Plot } from "@/types/layout"
import { StepHeading } from "./StepHeading"
import { STEP_TITLE } from "./steps"

interface PackageStepProps {
  plot: Plot
  packages: Package[]
  currency: string
  selectedPackage: Package
  onSelectPackage: (packageId: string) => void
}

export function PackageStep({ plot, packages, currency, selectedPackage, onSelectPackage }: PackageStepProps) {
  return (
    <>
      <StepHeading description="You can change this later, before paying.">{STEP_TITLE.package}</StepHeading>
      <PackagePicker
        packages={packages}
        basePrice={plot.basePrice}
        currency={currency}
        selectedId={selectedPackage.id}
        onSelect={onSelectPackage}
        hideLegend
      />
    </>
  )
}
