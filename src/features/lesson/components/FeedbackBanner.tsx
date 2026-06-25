import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export type FeedbackVariant = "correct" | "wrong" | "reveal";

interface FeedbackBannerProps {
  variant: FeedbackVariant;
  message: string;
  /** Optional secondary nudge (e.g. a human-readable misconception note). */
  detail?: string;
}

const STYLES: Record<FeedbackVariant, string> = {
  correct: "bg-correct/10 border-correct/30",
  wrong: "bg-hint/10 border-hint/40",
  reveal: "bg-accent/10 border-accent/30",
};

const LABEL_COLOR: Record<FeedbackVariant, string> = {
  correct: "text-correct",
  wrong: "text-hint",
  reveal: "text-accent",
};

const LABELS: Record<FeedbackVariant, string> = {
  correct: "Correct",
  wrong: "Hint",
  reveal: "Explanation",
};

function Icon({ variant }: { variant: FeedbackVariant }) {
  const cls = `h-5 w-5 shrink-0 ${LABEL_COLOR[variant]}`;
  if (variant === "correct") return <CheckCircle2 className={cls} aria-hidden="true" />;
  if (variant === "wrong") return <AlertCircle className={cls} aria-hidden="true" />;
  return <Info className={cls} aria-hidden="true" />;
}

export function FeedbackBanner({ variant, message, detail }: FeedbackBannerProps) {
  const anim = variant === "wrong" ? "animate-shake" : "animate-slide-up";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex ${anim} items-start gap-3 rounded-card border px-4 py-3 ${STYLES[variant]}`}
    >
      <Icon variant={variant} />
      <div className="flex flex-col">
        <span className={`text-xs font-bold uppercase tracking-wide ${LABEL_COLOR[variant]}`}>
          {LABELS[variant]}
        </span>
        <span className="text-sm text-ink/90">{message}</span>
        {detail && (
          <span className="mt-1 text-xs font-medium text-ink/60">{detail}</span>
        )}
      </div>
    </div>
  );
}
