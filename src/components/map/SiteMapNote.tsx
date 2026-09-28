/** Explains what a real site map needs, shown under the view toggle while it is active. */
export function SiteMapNote() {
  return (
    <p className="pointer-events-auto max-w-60 rounded-md bg-overlay px-3 py-2 text-[11px] leading-snug md:max-w-64 md:text-xs text-secondary shadow-float ring-1 ring-inset ring-line-subtle backdrop-blur-md">
      Site map view requires a survey drawing or plot coordinate data from the cemetery.
    </p>
  )
}
