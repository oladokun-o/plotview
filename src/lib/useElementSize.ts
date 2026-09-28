import { useCallback, useState } from "react"

export interface ElementSize {
  width: number
  height: number
}

/** Tracks an element's rendered size. Attach the returned callback as its `ref`. */
export function useElementSize<T extends HTMLElement>(): [(node: T | null) => void, ElementSize] {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  const ref = useCallback((node: T | null) => {
    if (!node) {
      return
    }
    const update = () => {
      const { width, height } = node.getBoundingClientRect()
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, size]
}
