interface LoadingScreenProps {
  label?: string;
}

export function LoadingScreen({ label = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas text-ink">
      <div className="flex flex-col items-center gap-3">
        <span
          className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent"
          aria-hidden="true"
        />
        <span className="text-sm text-ink/60">{label}</span>
      </div>
    </div>
  );
}
