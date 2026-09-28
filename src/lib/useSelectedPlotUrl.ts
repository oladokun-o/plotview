import { useEffect, useRef } from "react"
import { appActions, getAppState, useAppState } from "./store"

const PARAM = "plot"

/**
 * Keeps the selected plot in the URL (`?plot=A-12`) so a selection can be shared.
 *
 * On first load, a valid plot id in the URL is selected and passed to `onRestore`
 * (to move the map to it). Afterwards, every selection change replaces the URL
 * without adding history entries, so the back button still leaves the page.
 */
export function useSelectedPlotUrl(isValidPlot: (plotId: string) => boolean, onRestore: (plotId: string) => void): void {
  const selectedPlotId = useAppState((state) => state.selectedPlotId)
  const restored = useRef(false)
  const onRestoreRef = useRef(onRestore)
  const isValidRef = useRef(isValidPlot)

  useEffect(() => {
    onRestoreRef.current = onRestore
    isValidRef.current = isValidPlot
  })

  useEffect(() => {
    if (restored.current) {
      return
    }
    restored.current = true
    const requested = new URLSearchParams(window.location.search).get(PARAM)
    if (requested && isValidRef.current(requested)) {
      appActions.selectPlot(requested)
      onRestoreRef.current(requested)
    } else if (requested) {
      writeParam(null)
    }
  }, [])

  useEffect(() => {
    if (!restored.current) {
      return
    }
    const current = new URLSearchParams(window.location.search).get(PARAM)
    if (current !== selectedPlotId && getAppState().selectedPlotId === selectedPlotId) {
      writeParam(selectedPlotId)
    }
  }, [selectedPlotId])
}

function writeParam(plotId: string | null): void {
  const params = new URLSearchParams(window.location.search)
  if (plotId) {
    params.set(PARAM, plotId)
  } else {
    params.delete(PARAM)
  }
  const query = params.toString()
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`)
}
