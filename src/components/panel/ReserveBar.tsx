import { Button } from "@/components/ui/Button"
import { formatPrice } from "@/lib/format"
import type { Package } from "@/types/layout"

interface ReserveBarProps {
  pkg: Package
  price: number
  currency: string
  onReserve: () => void
}

/** The chosen package's total and the action that starts the reservation. */
export function ReserveBar({ pkg, price, currency, onReserve }: ReserveBarProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-secondary">{pkg.name}</p>
        <p className="text-lg font-semibold text-primary tabular-nums">{formatPrice(price, currency)}</p>
      </div>
      <Button size="lg" onClick={onReserve}>
        Reserve plot
      </Button>
    </div>
  )
}
