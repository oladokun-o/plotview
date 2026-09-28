import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/cn"

interface SampleDataBadgeProps {
  className?: string
}

/** Marks screens that show sample prices or layout, so nobody mistakes them for real figures. */
export function SampleDataBadge({ className }: SampleDataBadgeProps) {
  return <Badge className={cn("shadow-float", className)}>Sample data</Badge>
}
