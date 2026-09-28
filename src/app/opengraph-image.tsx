import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import branding from "@/data/branding.json"
import layoutData from "@/data/layout.json"
import { validateLayout } from "@/lib/layout"
import { loadGoogleFont } from "@/lib/socialImage/googleFont"
import { readPalette } from "@/lib/socialImage/palette"
import type { Branding } from "@/types/branding"
import type { PlotStatus, Section } from "@/types/layout"

/*
 * The image shown when a link to the site is shared (messaging apps, email,
 * social posts). Drawn once at build time from branding.json and layout.json,
 * so it follows a rebrand or a new site plan without being redrawn by hand.
 */

const siteBranding: Branding = branding

export const alt = `${siteBranding.siteName}: a section of the cemetery map showing available, reserved and occupied plots.`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const SUMMARY = "Explore the map, choose a plot and reserve it."
const SAMPLE_LABEL = "Sample data"
const MAX_ROWS = 5
const MAX_COLS = 8
const CELL_WIDTH = 38
const CELL_LENGTH = 66
const CELL_GAP = 10

/** The section with the most available plots: the most inviting corner of the site. */
function pickSection(sections: Section[]): Section {
  const available = (section: Section) => section.plots.filter((plot) => plot.status === "available").length
  return sections.reduce((best, section) => (available(section) > available(best) ? section : best))
}

export default async function Image() {
  const layout = validateLayout(layoutData)
  const palette = await readPalette()
  const section = pickSection(layout.sections)
  const rows = Math.min(section.rows, MAX_ROWS)
  const cols = Math.min(section.cols, MAX_COLS)
  const statusAt = new Map(section.plots.map((plot) => [`${plot.row},${plot.col}`, plot.status]))
  const firstAvailable = section.plots.find((plot) => plot.status === "available" && plot.row <= rows && plot.col <= cols)

  const logo = await readFile(join(process.cwd(), "public", siteBranding.logoPath))
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`

  // All text is set in the display face: the image renderer spaces words in the
  // interface font unevenly, and the serif suits a quiet card.
  const text = [siteBranding.siteName, siteBranding.tagline, SUMMARY, SAMPLE_LABEL, section.name].join("")
  const serif = await loadGoogleFont("Newsreader", 400, text)
  const fonts = serif ? [{ name: "Newsreader", data: serif, weight: 400 as const, style: "normal" as const }] : []

  const fill: Record<PlotStatus, string> = {
    available: palette["lichen-100"],
    reserved: palette["clay-100"],
    occupied: palette["slate-100"],
  }
  const edge: Record<PlotStatus, string> = {
    available: palette["lichen-500"],
    reserved: palette["clay-500"],
    occupied: palette["slate-500"],
  }
  const mark: Record<PlotStatus, string> = {
    available: palette["lichen-700"],
    reserved: palette["clay-700"],
    occupied: palette["slate-700"],
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: palette["stone-50"],
          fontFamily: "Newsreader",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 580, height: "100%", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <img src={logoSrc} width={72} height={72} alt="" />
            <div style={{ marginTop: 40, fontSize: 68, lineHeight: 1.05, color: palette["stone-900"] }}>
              {siteBranding.siteName}
            </div>
            <div style={{ marginTop: 20, fontSize: 34, lineHeight: 1.3, color: palette["stone-600"] }}>
              {siteBranding.tagline}
            </div>
            <div style={{ marginTop: 24, fontSize: 28, lineHeight: 1.35, color: palette["stone-700"] }}>{SUMMARY}</div>
          </div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 18px",
              borderRadius: 999,
              background: palette["stone-100"],
              border: `1px solid ${palette["stone-200"]}`,
              fontSize: 20,
              color: palette["stone-600"],
            }}
          >
            {SAMPLE_LABEL}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 32,
            borderRadius: 28,
            background: palette["stone-0"],
            border: `1px solid ${palette["stone-200"]}`,
            boxShadow: "0 12px 40px -12px rgba(28, 26, 24, 0.18)",
          }}
        >
          <div style={{ display: "flex", fontSize: 30, color: palette["stone-900"] }}>
            {section.name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: CELL_GAP, marginTop: 24 }}>
            {Array.from({ length: rows }, (_, rowIndex) => (
              <div key={rowIndex} style={{ display: "flex", gap: CELL_GAP }}>
                {Array.from({ length: cols }, (_, colIndex) => {
                  const status = statusAt.get(`${rowIndex + 1},${colIndex + 1}`)
                  if (!status) {
                    return <div key={colIndex} style={{ width: CELL_WIDTH, height: CELL_LENGTH }} />
                  }
                  const selected = firstAvailable?.row === rowIndex + 1 && firstAvailable.col === colIndex + 1
                  return (
                    <div
                      key={colIndex}
                      style={{
                        width: CELL_WIDTH,
                        height: CELL_LENGTH,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        background: fill[status],
                        border: selected ? `4px solid ${siteBranding.primaryColor}` : `2px solid ${edge[status]}`,
                      }}
                    >
                      {status === "occupied" && (
                        <div style={{ width: 12, height: 12, borderRadius: 999, background: mark.occupied }} />
                      )}
                      {status === "reserved" && (
                        <div style={{ width: 13, height: 13, background: mark.reserved, transform: "rotate(45deg)" }} />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
