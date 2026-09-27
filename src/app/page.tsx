import branding from "@/data/branding.json";
import { LayoutErrorScreen } from "@/components/LayoutErrorScreen";
import { SampleDataBadge } from "@/components/SampleDataBadge";
import { loadLayout } from "@/lib/layout";
import type { PlotStatus } from "@/types/layout";

export default function Home() {
  const result = loadLayout();

  if (!result.success) {
    return <LayoutErrorScreen message={result.error} />;
  }

  const { layout } = result;
  const statusCounts = layout.sections
    .flatMap((section) => section.plots)
    .reduce<Record<PlotStatus, number>>(
      (counts, plot) => {
        counts[plot.status] += 1;
        return counts;
      },
      { available: 0, reserved: 0, occupied: 0 },
    );

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <SampleDataBadge />
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{layout.site.name}</h1>
        <p className="mt-1 text-sm text-foreground/60">{branding.tagline}</p>
      </div>
      <dl className="flex gap-6 text-sm text-foreground/70">
        <div>
          <dt className="text-xs uppercase tracking-wide text-foreground/40">Sections</dt>
          <dd>{layout.sections.length}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-foreground/40">Available</dt>
          <dd>{statusCounts.available}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-foreground/40">Reserved</dt>
          <dd>{statusCounts.reserved}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-foreground/40">Occupied</dt>
          <dd>{statusCounts.occupied}</dd>
        </div>
      </dl>
      <p className="max-w-sm text-xs text-foreground/40">
        Layout loaded and validated from src/data/layout.json. The map view arrives in the next phase.
      </p>
    </div>
  );
}
