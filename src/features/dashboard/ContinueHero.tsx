import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import type { Recommendation } from "@/features/scoring/recommend";
import type { LessonProgress } from "@/types/progress";
import { getLesson } from "@/content/course";
import { estimateLessonMinutes, remainingMinutes } from "@/lib/lessonTime";

const EYEBROW: Record<Recommendation["kind"], string> = {
  continue: "Continue where you left off",
  next: "Up next",
  start: "Start learning",
  review: "Recommended review",
};

export function ContinueHero({
  recommendation,
  progress,
}: {
  recommendation: Recommendation;
  progress: LessonProgress[];
}) {
  const lesson = getLesson(recommendation.lessonId);
  const lessonProgress = progress.find(
    (p) => p.lessonId === recommendation.lessonId
  );
  const inProgress =
    recommendation.kind === "continue" ||
    lessonProgress?.status === "in_progress";

  let timeLabel: string | null = null;
  if (lesson) {
    timeLabel = inProgress
      ? `~${remainingMinutes(lesson, lessonProgress)} min left`
      : `~${estimateLessonMinutes(lesson)} min`;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative overflow-hidden rounded-card bg-gradient-to-br from-accent via-violet to-sky p-6 text-white shadow-pop md:p-8"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {EYEBROW[recommendation.kind]}
          </span>
          {timeLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {timeLabel}
            </span>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-extrabold leading-tight md:text-3xl">
            {recommendation.title}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-white/85 md:text-base">
            {recommendation.reason}
          </p>
        </div>

        {recommendation.playable ? (
          <Link
            to={`/lesson/${recommendation.lessonId}`}
            className="inline-flex w-fit items-center gap-2 rounded-card bg-white px-6 py-3 text-sm font-bold text-accent shadow-soft transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {recommendation.cta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <span className="inline-block w-fit rounded-card bg-white/20 px-6 py-3 text-sm font-semibold text-white/85">
            {recommendation.cta}
          </span>
        )}
      </div>
    </motion.section>
  );
}
