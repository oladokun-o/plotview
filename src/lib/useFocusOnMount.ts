import { useEffect, useRef } from "react"

/**
 * Focuses the element once, when it first renders. For headings that replace
 * the content someone was using (a new step, a payment state), so keyboard and
 * screen reader users land on what just appeared instead of the top of the page.
 * The element needs tabIndex={-1}.
 */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])
  return ref
}
