"use client"

import { AnimatePresence, LazyMotion, MotionConfig, domAnimation } from "motion/react"
import { SheetSurface, type SheetSurfaceProps } from "./SheetSurface"

interface BottomSheetProps extends Omit<SheetSurfaceProps, "model"> {
  model: SheetSurfaceProps["model"] | null
}

/** Phones: plot details in a sheet that slides up from the bottom edge. */
export function BottomSheet({ model, ...rest }: BottomSheetProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <AnimatePresence>{model && <SheetSurface key="bottom-sheet" model={model} {...rest} />}</AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  )
}
