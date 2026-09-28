"use client"

import { useEffect, useRef, type ReactNode } from "react"

interface StepHeadingProps {
  children: ReactNode
  description?: string
}

/**
 * Each step's heading. The flow moves focus here when the step changes, so
 * keyboard and screen reader users land at the start of the new step.
 */
export function StepHeading({ children, description }: StepHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Steps remount when the step changes, so focusing on mount lands on each new step.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="mb-4 md:mb-5">
      <h3 ref={headingRef} tabIndex={-1} className="font-display text-xl text-primary outline-none md:text-2xl">
        {children}
      </h3>
      {description && <p className="mt-1 text-sm leading-relaxed text-secondary">{description}</p>}
    </div>
  )
}
