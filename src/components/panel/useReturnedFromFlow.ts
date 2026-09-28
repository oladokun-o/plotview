import { useState } from "react"

/**
 * True once the reserve flow for this plot has closed back to its details
 * (the back arrow on the first step), so focus can return to the Reserve plot
 * button where the person left, instead of falling to the top of the page.
 * Resets when another plot is shown.
 */
export function useReturnedFromFlow(plotId: string, reserving: boolean): boolean {
  const [previous, setPrevious] = useState({ plotId, reserving, returned: false })
  if (previous.plotId !== plotId || previous.reserving !== reserving) {
    const returned = previous.plotId === plotId && previous.reserving && !reserving
    setPrevious({ plotId, reserving, returned })
    return returned
  }
  return previous.returned
}
