interface LayoutErrorScreenProps {
  message: string
}

export function LayoutErrorScreen({ message }: LayoutErrorScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">Cemetery layout couldn&apos;t be loaded</h1>
      <p className="max-w-md text-sm text-foreground/70">{message}</p>
      <p className="max-w-md text-xs text-foreground/50">
        Check src/data/layout.json against the schema in src/types/layout.ts.
      </p>
    </div>
  )
}
