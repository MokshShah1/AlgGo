import { Link } from "react-router-dom";
import { Check, ChevronRight, Lock } from "lucide-react";
import type { Lesson } from "@/types/lesson";
import type { LessonDisplay, LessonTone } from "@/features/course/lessonDisplay";

const BADGE_STYLES: Record<LessonTone, string> = {
  completed: "bg-correct/15 text-correct",
  "in-progress": "bg-accent/15 text-accent",
  recommended: "bg-accent/15 text-accent",
  start: "bg-ink/10 text-ink/70",
  locked: "bg-ink/5 text-ink/40",
  preview: "bg-ink/5 text-ink/50",
};

export function LessonPathCard({
  lesson,
  display,
}: {
  lesson: Lesson;
  display: LessonDisplay;
}) {
  const locked = display.tone === "locked" || display.tone === "preview";

  const inner = (
    <div
      className={`group flex items-center gap-3 rounded-card border p-4 transition-all duration-200 ${
        locked
          ? "border-white/5 bg-surface/50"
          : "border-white/5 bg-surface shadow-soft hover:-translate-y-0.5 hover:shadow-card active:scale-[0.99]"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-transform group-hover:scale-105 ${
          display.tone === "completed"
            ? "bg-correct text-white shadow-[0_4px_14px_-4px_rgba(21,160,90,0.5)]"
            : display.tone === "recommended" || display.tone === "in-progress"
              ? "bg-gradient-to-br from-accent to-violet text-white shadow-soft"
              : "bg-ink/10 text-ink/70"
        }`}
      >
        {display.tone === "completed" ? (
          <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
        ) : (
          lesson.order
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold ${
            locked ? "text-ink/50" : "text-ink"
          }`}
        >
          {lesson.title}
        </p>
        <span
          className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[display.tone]}`}
        >
          {display.badge}
        </span>
      </div>
      {display.cta && !locked && (
        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-accent">
          {display.cta}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      )}
      {locked && (
        <Lock className="h-4 w-4 shrink-0 text-ink/30" aria-hidden="true" />
      )}
    </div>
  );

  if (display.to && !locked) {
    return (
      <Link to={display.to} className="block">
        {inner}
      </Link>
    );
  }
  return <div>{inner}</div>;
}
