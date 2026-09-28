import { LayoutGrid, Map as MapIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/cn"
import type { MapView } from "@/lib/store"

interface ViewToggleProps {
  view: MapView
  onChange: (view: MapView) => void
}

const OPTIONS: { value: MapView; label: string; icon: ReactNode }[] = [
  { value: "grid", label: "Grid", icon: <LayoutGrid aria-hidden="true" className="size-4" /> },
  { value: "sitemap", label: "Site map", icon: <MapIcon aria-hidden="true" className="size-4" /> },
]

/** Switches between the two map views, like map and satellite in a maps app. */
export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Map view"
      className="pointer-events-auto inline-flex h-10 items-center gap-0.5 rounded-lg bg-overlay p-1 shadow-float ring-1 ring-inset ring-line-subtle backdrop-blur-md"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === view
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm sm:px-3 font-medium whitespace-nowrap",
              "transition-[background-color,color,box-shadow] duration-150 ease-standard",
              selected ? "bg-surface text-primary shadow-float" : "text-secondary hover:text-primary",
            )}
          >
            {option.icon}
            <span className="sr-only sm:not-sr-only">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
