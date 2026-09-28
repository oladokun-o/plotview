import { cn } from "@/lib/cn"
import { formatPrice } from "@/lib/format"
import type { Package } from "@/types/layout"

interface PackageOptionProps {
  pkg: Package
  name: string
  price: number
  currency: string
  checked: boolean
  onSelect: () => void
}

/** One package as a selectable card: a native radio input underneath, so keyboards and screen readers work as expected. */
export function PackageOption({ pkg, name, price, currency, checked, onSelect }: PackageOptionProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md p-3 ring-1 ring-inset transition-[background-color,box-shadow] duration-150 ease-standard",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
        checked ? "bg-accent-soft ring-2 ring-accent" : "bg-surface ring-line-subtle hover:bg-sunken",
      )}
    >
      <input type="radio" name={name} value={pkg.id} checked={checked} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ring-1 ring-inset transition-colors",
          checked ? "bg-accent ring-accent" : "bg-surface ring-line-strong",
        )}
      >
        <span className={cn("size-1.5 rounded-full bg-on-accent", checked ? "opacity-100" : "opacity-0")} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-primary">{pkg.name}</span>
        <span className="mt-0.5 block text-xs leading-snug text-secondary">{pkg.description}</span>
      </span>
      <span className="text-sm font-semibold whitespace-nowrap text-primary tabular-nums">{formatPrice(price, currency)}</span>
    </label>
  )
}
