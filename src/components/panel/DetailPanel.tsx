"use client"

import { X } from "lucide-react"
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from "motion/react"
import { useId } from "react"
import { IconButton } from "@/components/ui/IconButton"
import type { Package } from "@/types/layout"
import { PlotDetailsBody } from "./PlotDetailsBody"
import { PlotSummary } from "./PlotSummary"
import { ReserveBar } from "./ReserveBar"
import type { PlotDetailsModel } from "./types"

interface DetailPanelProps {
  model: PlotDetailsModel | null
  selectedPackage: Package
  top: number
  onSelectPackage: (packageId: string) => void
  onViewPlot: (plotId: string) => void
  onReserve: () => void
  onClose: () => void
}

/** Wide screens: plot details in a panel floating over the left of the map. */
export function DetailPanel({ model, selectedPackage, top, onSelectPackage, onViewPlot, onReserve, onClose }: DetailPanelProps) {
  const headingId = useId()

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <AnimatePresence>
          {model && (
            <m.aside
              key="detail-panel"
              aria-labelledby={headingId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.18, ease: [0.3, 0, 1, 1] } }}
              transition={{ type: "spring", bounce: 0, duration: 0.45 }}
              style={{ top, maxHeight: `calc(100% - ${top}px - 1rem)` }}
              className="pointer-events-auto absolute left-4 z-10 flex w-[360px] flex-col overflow-hidden rounded-xl bg-surface shadow-float ring-1 ring-inset ring-line-subtle"
            >
              <m.div
                key={model.plot.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex items-start gap-3 border-b border-line-subtle p-5">
                  <PlotSummary plot={model.plot} section={model.section} headingId={headingId} />
                  <IconButton
                    label="Close plot details"
                    variant="ghost"
                    size="sm"
                    icon={<X aria-hidden="true" className="size-4" />}
                    onClick={onClose}
                    className="ml-auto -mt-1 -mr-1"
                  />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
                  <PlotDetailsBody
                    model={model}
                    selectedPackage={selectedPackage}
                    onSelectPackage={onSelectPackage}
                    onViewPlot={onViewPlot}
                  />
                </div>
                {model.plot.status === "available" && (
                  <div className="border-t border-line-subtle p-5">
                    <ReserveBar
                      pkg={selectedPackage}
                      price={model.plot.basePrice * selectedPackage.priceMultiplier}
                      currency={model.currency}
                      onReserve={onReserve}
                    />
                  </div>
                )}
              </m.div>
            </m.aside>
          )}
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  )
}
