/**
 * Fetches a font from Google Fonts as TrueType, cut down to just the characters
 * in `text`, for the share image renderer (which cannot read woff2).
 * Resolves to null when the font cannot be fetched; the image then falls back
 * to the renderer's built-in font rather than failing the build.
 */
export async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    // encodeURIComponent, not URLSearchParams: Google reads "+" as a plus sign,
    // which would leave the space out of the font.
    const query = `family=${encodeURIComponent(`${family}:wght@${weight}`)}&text=${encodeURIComponent(text)}`
    const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    if (!url) {
      return null
    }
    const response = await fetch(url)
    return response.ok ? await response.arrayBuffer() : null
  } catch {
    return null
  }
}
