"use client"

import { ArrowLeft, Search } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState, type Ref } from "react"
import { IconButton } from "@/components/ui/IconButton"
import { Surface } from "@/components/ui/Surface"
import { cn } from "@/lib/cn"
import type { SearchResult } from "@/lib/search"
import type { Branding } from "@/types/branding"
import type { Layout } from "@/types/layout"
import { SearchBox } from "./SearchBox"

interface TopBarProps {
  layout: Layout
  branding: Branding
  onPick: (result: SearchResult) => void
  ref?: Ref<HTMLDivElement>
  /** Takes the whole bar out of the tab order and accessibility tree while it is hidden. */
  inert?: boolean
  className?: string
}

/**
 * Brand and search. On wide screens both are always visible. On a phone the
 * brand row shows by default and search opens in its place, like a maps app.
 */
export function TopBar({ layout, branding, onPick, ref, inert, className }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus()
    }
  }, [searchOpen])

  function handlePick(result: SearchResult) {
    setSearchOpen(false)
    onPick(result)
  }

  return (
    <Surface ref={ref} inert={inert} className={cn("pointer-events-auto p-2 md:p-3", className)}>
      <div className={cn("items-center gap-3 pl-1 md:flex md:pl-0", searchOpen ? "hidden" : "flex")}>
        <Image src={branding.logoPath} alt="" width={36} height={36} unoptimized className="size-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[17px] leading-tight text-primary">{branding.siteName}</p>
          <p className="hidden truncate text-xs text-secondary md:block">{branding.tagline}</p>
        </div>
        <IconButton
          label="Search for a plot or section"
          variant="ghost"
          icon={<Search aria-hidden="true" className="size-5" />}
          onClick={() => setSearchOpen(true)}
          className="md:hidden"
        />
      </div>
      <div className={cn("items-center gap-1 md:mt-3 md:block", searchOpen ? "flex" : "hidden")}>
        <IconButton
          label="Close search"
          variant="ghost"
          icon={<ArrowLeft aria-hidden="true" className="size-5" />}
          onClick={() => setSearchOpen(false)}
          className="md:hidden"
        />
        <SearchBox
          layout={layout}
          onPick={handlePick}
          onDismiss={() => setSearchOpen(false)}
          inputRef={inputRef}
          className="flex-1"
        />
      </div>
    </Surface>
  )
}
