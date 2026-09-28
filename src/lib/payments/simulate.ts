/** Waits, like a real gateway would, but can be cancelled. */
export function simulatedDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Payment cancelled", "AbortError"))
      return
    }
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer)
        reject(new DOMException("Payment cancelled", "AbortError"))
      },
      { once: true },
    )
  })
}

/** A transaction id in the style of the given prefix, e.g. MP260928.1432.A7F3. */
export function simulatedTransactionId(prefix: string, date = new Date()): string {
  const stamp = date.toISOString().slice(2, 10).replace(/-/g, "")
  const time = date.toISOString().slice(11, 16).replace(":", "")
  const code = Math.random().toString(16).slice(2, 6).toUpperCase()
  return `${prefix}${stamp}.${time}.${code}`
}
