import { Surface } from "@/components/ui/Surface"
import type { LayoutIssue } from "@/lib/layout"

interface LayoutErrorScreenProps {
  issue: LayoutIssue
}

export function LayoutErrorScreen({ issue }: LayoutErrorScreenProps) {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-4 py-10">
      <Surface variant="panel" className="w-full max-w-lg p-6 sm:p-8">
        <p className="text-xs font-medium tracking-wide text-tertiary uppercase">Configuration error</p>
        <h1 className="mt-2 font-display text-2xl text-primary">The cemetery layout could not be loaded</h1>
        <p className="mt-3 text-sm leading-relaxed text-secondary">
          The map is drawn from <code className="font-mono text-primary">src/data/layout.json</code>. One value in
          that file does not match the expected format:
        </p>

        <dl className="mt-5 space-y-3 rounded-md bg-sunken p-4 text-sm ring-1 ring-inset ring-line-subtle">
          <div>
            <dt className="text-xs text-tertiary">Where</dt>
            <dd className="mt-0.5 font-mono break-all text-primary">{issue.path}</dd>
          </div>
          <div>
            <dt className="text-xs text-tertiary">Problem</dt>
            <dd className="mt-0.5 text-primary">{issue.message}</dd>
          </div>
        </dl>

        <p className="mt-5 text-sm leading-relaxed text-secondary">
          Fix the value and reload. Every field is described in{" "}
          <code className="font-mono text-primary">src/types/layout.ts</code>.
        </p>
      </Surface>
    </main>
  )
}
