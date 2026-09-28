import { Minus, Plus, Scan } from "lucide-react"
import { IconButton } from "@/components/ui/IconButton"

interface ZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onRecentre: () => void
}

/**
 * Zoom and recentre. On touch screens pinch does the zooming, so only
 * recentre is shown, within thumb reach.
 */
export function ZoomControls({ onZoomIn, onZoomOut, onRecentre }: ZoomControlsProps) {
  return (
    <div className="pointer-events-auto flex flex-col gap-2">
      <div className="hidden flex-col overflow-hidden rounded-md bg-overlay shadow-float ring-1 ring-inset ring-line-subtle backdrop-blur-md md:flex">
        <IconButton
          label="Zoom in"
          variant="ghost"
          icon={<Plus aria-hidden="true" className="size-4" />}
          onClick={onZoomIn}
          className="rounded-none"
        />
        <span aria-hidden="true" className="mx-2 h-px bg-line-subtle" />
        <IconButton
          label="Zoom out"
          variant="ghost"
          icon={<Minus aria-hidden="true" className="size-4" />}
          onClick={onZoomOut}
          className="rounded-none"
        />
      </div>
      <IconButton label="Show whole map" icon={<Scan aria-hidden="true" className="size-4" />} onClick={onRecentre} />
    </div>
  )
}
