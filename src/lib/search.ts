import type { Layout, Plot, Section } from "@/types/layout"

export type SearchResult =
  | { kind: "plot"; id: string; plot: Plot; section: Section }
  | { kind: "section"; id: string; section: Section; availableCount: number }

const DEFAULT_LIMIT = 8

/** Lowercase with spaces, hyphens and dots removed: "A-12", "a 12" and "a12" all match. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[\s\-_.]/g, "")
}

function sectionResult(section: Section): SearchResult {
  return {
    kind: "section",
    id: `section:${section.id}`,
    section,
    availableCount: section.plots.filter((plot) => plot.status === "available").length,
  }
}

function plotResult(plot: Plot, section: Section): SearchResult {
  return { kind: "plot", id: `plot:${plot.id}`, plot, section }
}

/**
 * Finds plots and sections for a search query.
 *
 * - Empty query: every section, so the field doubles as quick navigation.
 * - Exact plot id ("A-12", "a12"): that plot first.
 * - A bare number ("12"): plot 12 in every section.
 * - Otherwise: sections whose code or name matches, then plots whose id starts with the query.
 */
export function searchLayout(layout: Layout, query: string, limit = DEFAULT_LIMIT): SearchResult[] {
  const needle = normalize(query)
  if (needle.length === 0) {
    return layout.sections.map(sectionResult).slice(0, limit)
  }

  const exactPlots: SearchResult[] = []
  const numberPlots: SearchResult[] = []
  const prefixPlots: SearchResult[] = []
  const sections: SearchResult[] = []
  const isNumber = /^\d+$/.test(needle)
  const phrase = query.trim().toLowerCase()

  for (const section of layout.sections) {
    const code = normalize(section.id)
    if (code === needle || section.name.toLowerCase().includes(phrase)) {
      sections.push(sectionResult(section))
    }

    for (const plot of section.plots) {
      const id = normalize(plot.id)
      if (id === needle) {
        exactPlots.push(plotResult(plot, section))
      } else if (isNumber && id === `${code}${needle}`) {
        numberPlots.push(plotResult(plot, section))
      } else if (!isNumber && needle.length >= 2 && id.startsWith(needle)) {
        prefixPlots.push(plotResult(plot, section))
      }
    }
  }

  return [...exactPlots, ...numberPlots, ...sections, ...prefixPlots].slice(0, limit)
}
