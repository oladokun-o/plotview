import { LayoutErrorScreen } from "@/components/LayoutErrorScreen";
import { MapContainer } from "@/components/map/MapContainer";
import { loadLayout } from "@/lib/layout";

export default function Home() {
  const result = loadLayout();

  if (!result.success) {
    return <LayoutErrorScreen issue={result.issue} />;
  }

  return <MapContainer layout={result.layout} />;
}
