import { LayoutErrorScreen } from "@/components/LayoutErrorScreen";
import { MapShell } from "@/components/map/MapShell";
import branding from "@/data/branding.json";
import { loadLayout } from "@/lib/layout";
import type { Branding } from "@/types/branding";

const siteBranding: Branding = branding;

export default function Home() {
  const result = loadLayout();

  if (!result.success) {
    return <LayoutErrorScreen issue={result.issue} />;
  }

  return <MapShell layout={result.layout} branding={siteBranding} />;
}
