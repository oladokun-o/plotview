const formatters = new Map<string, Intl.NumberFormat>()

/** Formats a price in the layout's currency, without decimals for whole amounts: "$1,400". */
export function formatPrice(amount: number, currency: string): string {
  let formatter = formatters.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 })
    formatters.set(currency, formatter)
  }
  return formatter.format(amount)
}
