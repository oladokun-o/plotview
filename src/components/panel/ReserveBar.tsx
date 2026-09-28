"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/Button"
import { formatPrice } from "@/lib/format"
import type { Package } from "@/types/layout"

interface ReserveBarProps {
  pkg: Package
  price: number
  currency: string
  onReserve: () => void
  /** Focus the button when it appears: the person has just come back out of the reserve flow. */
  focusOnMount?: boolean
}

/** The chosen package's total and the action that starts the reservation. */
export function ReserveBar({ pkg, price, currency, onReserve, focusOnMount = false }: ReserveBarProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (focusOnMount) {
      buttonRef.current?.focus({ preventScroll: true })
    }
  }, [focusOnMount])

  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-secondary">{pkg.name}</p>
        <p className="text-lg font-semibold text-primary tabular-nums">{formatPrice(price, currency)}</p>
      </div>
      <Button ref={buttonRef} size="lg" onClick={onReserve}>
        Reserve plot
      </Button>
    </div>
  )
}
