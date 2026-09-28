import { Spinner } from "@/components/ui/Spinner"

/**
 * Shown where the map will be until it has been placed on screen. The map needs
 * the page's script to measure the screen first, which takes a moment on a slow
 * connection. Fades in only after a short delay (motion.css), so a fast load
 * never flashes it.
 */
export function MapLoadingHint() {
  return (
    <div
      role="status"
      data-loading-hint=""
      className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-sm text-secondary"
    >
      <Spinner size={16} />
      Loading the map
    </div>
  )
}
