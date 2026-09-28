"use client"

import { Search, X } from "lucide-react"
import { useId, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react"
import { cn } from "@/lib/cn"
import { searchLayout, type SearchResult } from "@/lib/search"
import type { Layout } from "@/types/layout"
import { SearchResultOption } from "./SearchResultOption"

interface SearchBoxProps {
  layout: Layout
  onPick: (result: SearchResult) => void
  /** Called when the person closes the search with Escape on an empty field. */
  onDismiss?: () => void
  inputRef?: RefObject<HTMLInputElement | null>
  className?: string
}

/** Search for a plot or section. Follows the ARIA combobox pattern with a list popup. */
export function SearchBox({ layout, onPick, onDismiss, inputRef, className }: SearchBoxProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const fallbackInputRef = useRef<HTMLInputElement | null>(null)
  const localInputRef = inputRef ?? fallbackInputRef
  const listId = useId()
  const optionId = (index: number) => `${listId}-option-${index}`

  const results = useMemo(() => searchLayout(layout, query), [layout, query])
  const hasQuery = query.trim().length > 0
  const showList = open && (results.length > 0 || hasQuery)

  function pick(result: SearchResult) {
    onPick(result)
    setQuery("")
    setOpen(false)
    localInputRef.current?.blur()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const step = event.key === "ArrowDown" ? 1 : -1
      setActiveIndex((index) => (results.length === 0 ? 0 : (index + step + results.length) % results.length))
    } else if (event.key === "Enter") {
      const result = results[activeIndex] ?? results[0]
      if (open && result) {
        event.preventDefault()
        pick(result)
      }
    } else if (event.key === "Escape") {
      // As in the ARIA combobox pattern: close the list, then clear the field, then leave.
      if (showList) {
        setOpen(false)
      } else if (hasQuery) {
        setQuery("")
      } else {
        onDismiss?.()
      }
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex h-11 items-center gap-2 rounded-md bg-sunken px-3 ring-1 ring-inset ring-line-control transition-shadow duration-150 focus-within:ring-2 focus-within:ring-focus">
        <Search aria-hidden="true" className="size-4 shrink-0 text-tertiary" />
        <input
          ref={localInputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-label="Search for a plot or section"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && results.length > 0 ? optionId(activeIndex) : undefined}
          placeholder="Search plot or section"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-primary outline-none placeholder:text-tertiary"
        />
        {hasQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQuery("")
              setActiveIndex(0)
              localInputRef.current?.focus()
            }}
            className="-mr-1 flex size-7 items-center justify-center rounded-sm text-tertiary hover:bg-raised hover:text-primary"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label="Search results"
        className={cn(
          "absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-lg bg-surface p-1.5 shadow-float ring-1 ring-inset ring-line-subtle",
          showList ? "block" : "hidden",
        )}
      >
        {!hasQuery && results.length > 0 && (
          <li role="presentation" className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-tertiary">
            Sections
          </li>
        )}
        {results.map((result, index) => (
          <SearchResultOption
            key={result.id}
            id={optionId(index)}
            result={result}
            active={index === activeIndex}
            onPick={() => pick(result)}
            onHover={() => setActiveIndex(index)}
          />
        ))}
        {hasQuery && results.length === 0 && (
          <li role="presentation" className="px-2.5 py-3 text-sm text-secondary">
            No plot or section matches “{query.trim()}”.
          </li>
        )}
      </ul>
    </div>
  )
}
