import { readFile } from "node:fs/promises"
import { join } from "node:path"

/**
 * The raw palette from src/styles/tokens.css, as `{ "stone-50": "#f7f5f0", ... }`.
 *
 * The share image is drawn by a renderer that cannot read CSS variables, so it
 * reads the primitive colours from the token file instead of repeating them.
 * Only plain hex primitives are picked up; semantic tokens are not needed.
 */
export async function readPalette(): Promise<Record<string, string>> {
  const css = await readFile(join(process.cwd(), "src/styles/tokens.css"), "utf8")
  const palette: Record<string, string> = {}
  for (const match of css.matchAll(/--([a-z]+-\d+):\s*(#[0-9a-f]{6});/gi)) {
    palette[match[1]] ??= match[2]
  }
  return palette
}
