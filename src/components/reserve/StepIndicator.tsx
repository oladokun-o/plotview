import { cn } from "@/lib/cn"
import { RESERVE_STEPS, type ReserveStep } from "@/lib/store"
import { STEP_TITLE } from "./steps"

interface StepIndicatorProps {
  step: ReserveStep
}

/** Where the person is in the flow: a line of text and a segmented bar. */
export function StepIndicator({ step }: StepIndicatorProps) {
  const complete = step === "confirmation"
  const index = complete ? RESERVE_STEPS.length : RESERVE_STEPS.indexOf(step)
  return (
    <div>
      <p className="text-xs text-secondary tabular-nums">
        {complete ? "Reservation complete" : `Step ${index + 1} of ${RESERVE_STEPS.length} · ${STEP_TITLE[step]}`}
      </p>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {RESERVE_STEPS.map((item, itemIndex) => (
          <span
            key={item}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300 ease-standard",
              itemIndex <= index ? "bg-accent" : "bg-line-subtle",
            )}
          />
        ))}
      </div>
    </div>
  )
}
