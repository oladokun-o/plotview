import { useSyncExternalStore } from "react"

/**
 * Whether a media query matches, kept in sync with the browser. On the server
 * and during hydration it reports false (mobile first), then updates.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
