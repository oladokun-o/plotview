"use client"

import type { ReactNode } from "react"
import { useFocusOnMount } from "@/lib/useFocusOnMount"

interface StepHeadingProps {
  children: ReactNode
  description?: string
}

/**
 * Each step's heading. The flow moves focus here when the step changes, so
 * keyboard and screen reader users land at the start of the new step.
 */
export function StepHeading({ children, description }: StepHeadingProps) {
  // Steps remount when the step changes, so focusing on mount lands on each new step.
  const headingRef = useFocusOnMount<HTMLHeadingElement>()

  return (
    <div className="mb-4 md:mb-5">
      <h3 ref={headingRef} tabIndex={-1} className="font-display text-xl text-primary outline-none md:text-2xl">
        {children}
      </h3>
      {description && <p className="mt-1 text-sm leading-relaxed text-secondary">{description}</p>}
    </div>
  )
}
