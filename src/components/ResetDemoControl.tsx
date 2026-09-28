"use client"

import { Check, RotateCcw } from "lucide-react"
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { cn } from "@/lib/cn"
import { appActions } from "@/lib/store"

type Stage = "idle" | "confirming" | "done"

const DONE_MS = 2400

const PILL = "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap"

/**
 * Clears everything the demo has stored (reservations, preferences, entered
 * details) so the next person starts from the sample layout. Asks once before
 * clearing, in a small card above the button, because it cannot be undone.
 */
export function ResetDemoControl({ className }: { className?: string }) {
  const [stage, setStage] = useState<Stage>("idle")
  const rootRef = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const questionId = useId()
  const cardId = useId()

  useEffect(() => {
    if (stage === "done") {
      const timer = window.setTimeout(() => setStage("idle"), DONE_MS)
      return () => window.clearTimeout(timer)
    }
    if (stage !== "confirming") {
      return
    }
    confirmRef.current?.focus()
    // A tap anywhere else is a change of mind.
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setStage("idle")
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [stage])

  function cancel() {
    setStage("idle")
    triggerRef.current?.focus()
  }

  function reset() {
    appActions.resetDemo()
    setStage("done")
    triggerRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && stage === "confirming") {
      event.stopPropagation()
      cancel()
    }
  }

  return (
    <div ref={rootRef} onKeyDown={handleKeyDown} className={cn("pointer-events-auto relative", className)}>
      {stage === "confirming" && (
        <div
          id={cardId}
          role="group"
          aria-labelledby={questionId}
          className="absolute bottom-full left-0 mb-2 w-60 rounded-lg bg-surface p-3 shadow-float ring-1 ring-inset ring-line-subtle"
        >
          <p id={questionId} className="text-sm text-primary">
            Clear all reservations and entered details?
          </p>
          <p className="mt-1 text-xs text-secondary">Every plot goes back to its sample status.</p>
          <div className="mt-3 flex gap-2">
            <button
              ref={confirmRef}
              type="button"
              onClick={reset}
              className={cn(PILL, "bg-accent text-on-accent transition-colors duration-150 hover:bg-accent-hover")}
            >
              Reset demo
            </button>
            <button
              type="button"
              onClick={cancel}
              className={cn(PILL, "text-secondary transition-colors duration-150 hover:bg-sunken hover:text-primary")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={stage === "confirming"}
        aria-controls={stage === "confirming" ? cardId : undefined}
        onClick={() => stage !== "done" && setStage(stage === "confirming" ? "idle" : "confirming")}
        className={cn(
          PILL,
          "bg-overlay text-secondary shadow-float ring-1 ring-inset ring-line-subtle backdrop-blur-md",
          "transition-colors duration-150 hover:text-primary",
          stage === "done" && "text-primary",
        )}
      >
        {stage === "done" ? (
          <Check size={14} strokeWidth={2} aria-hidden="true" />
        ) : (
          <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
        )}
        {stage === "done" ? "Demo reset" : "Reset demo"}
      </button>
      <span role="status" className="sr-only">
        {stage === "done" ? "Demo reset. Every plot is back to its sample status." : ""}
      </span>
    </div>
  )
}
