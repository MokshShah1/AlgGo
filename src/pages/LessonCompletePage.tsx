import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { course, getLesson, getNextLesson } from "@/content/course";
import { Confetti } from "@/components/Confetti";
import { Certificate } from "@/features/course/Certificate";
import { useAuth } from "@/features/auth/AuthContext";
import { useLearnerData } from "@/features/progress/useLearnerData";
import { RecapCard } from "@/features/lesson/RecapCard";
import { CONCEPT_LABELS } from "@/types/concepts";
import { playComplete } from "@/lib/sfx";

interface CompleteState {
  xpEarned?: number;
  bonusXp?: number;
  correctCount?: number;
  total?: number;
  streakCount?: number;
  score?: number;
  passed?: boolean;
}

export function LessonCompletePage() {
  const { lessonId = "" } = useParams();
  const location = useLocation();
  const state = (location.state ?? {}) as CompleteState;
  const { profile } = useAuth();
  const { progress, mastery } = useLearnerData();

  useEffect(() => {
    playComplete();
  }, []);

  const lesson = getLesson(lessonId);
  const next = getNextLesson(lessonId);

  const completedCount = progress.filter((p) => p.status === "completed").length;
  const chapterComplete = completedCount >= course.lessons.length;

  const masteredLabels = mastery
    .filter((m) => m.level >= 3)
    .map((m) => CONCEPT_LABELS[m.conceptId] ?? m.conceptId);
  const reviewLabels = mastery
    .filter((m) => m.needsReview && m.level < 3)
    .map((m) => CONCEPT_LABELS[m.conceptId] ?? m.conceptId);

  const totalXp = (state.xpEarned ?? 0) + (state.bonusXp ?? 0);
  // Default to passed when state is missing (e.g. a hard refresh) so we never
  // trap a learner who actually did fine.
  const passed = state.passed ?? true;
  const score = state.score;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-canvas via-canvas to-accent/5 px-5 py-12 text-ink">
      {passed && <Confetti />}

      {/* Decorative soft glows */}
      <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-violet/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {passed ? (
            <div className="relative flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-correct/40" />
              <div className="relative flex h-20 w-20 animate-scale-in items-center justify-center rounded-full bg-correct/15 shadow-[0_8px_30px_-8px_rgba(21,160,90,0.5)]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-10 w-10 animate-draw-check text-correct"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ strokeDasharray: 30, strokeDashoffset: 30 }}
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex h-20 w-20 animate-scale-in items-center justify-center rounded-full bg-hint/15 text-3xl shadow-soft">
              {typeof score === "number" ? `${score}%` : "!"}
            </div>
          )}
          <h1 className="animate-fade-in-up text-3xl font-bold">
            {passed ? "Lesson complete!" : "So close!"}
          </h1>
          <p className="animate-fade-in-up stagger-1 text-ink/70">
            {passed
              ? `${lesson ? lesson.title : "Great work"} - nicely done.`
              : "You need 80% to unlock the next lesson. Give it another go - you've got this."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="XP earned" value={`+${totalXp}`} accent delay="stagger-1" />
          {typeof score === "number" ? (
            <Stat
              label="Score"
              value={`${score}%`}
              delay="stagger-2"
            />
          ) : (
            typeof state.streakCount === "number" && (
              <Stat label="Day streak" value={`${state.streakCount}`} delay="stagger-2" />
            )
          )}
          {typeof state.correctCount === "number" &&
            typeof state.total === "number" && (
              <Stat
                label="Correct"
                value={`${state.correctCount}/${state.total}`}
                delay="stagger-3"
              />
            )}
        </div>

        <RecapCard
          lessonTitle={lesson?.title ?? "this lesson"}
          score={score}
          mastered={masteredLabels}
          toReview={reviewLabels}
        />

        {passed && chapterComplete && (
          <div className="flex flex-col gap-2">
            <p className="text-center text-sm font-bold text-correct">
              You finished the whole chapter!
            </p>
            <Certificate
              name={profile?.displayName || "Learner"}
              courseTitle={course.title}
            />
          </div>
        )}

        {passed && next && (
          <div className="animate-fade-in-up stagger-3 card p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              Next up - unlocked!
            </span>
            <p className="mt-1 font-semibold">{next.title}</p>
            <p className="mt-1 text-sm text-ink/70">You're ready - jump in.</p>
            <Link to={`/lesson/${next.id}`} className="btn-primary mt-3 w-full">
              Start next lesson
            </Link>
          </div>
        )}

        <div className="flex animate-fade-in-up stagger-4 flex-col gap-3">
          {!passed && lesson && (
            <Link to={`/lesson/${lesson.id}`} className="btn-primary w-full">
              Try again
            </Link>
          )}
          <Link
            to="/dashboard"
            className={passed ? "btn-primary w-full" : "btn-ghost w-full"}
          >
            Back to dashboard
          </Link>
          <Link to="/course" className="btn-ghost w-full">
            View course map
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  delay,
}: {
  label: string;
  value: string;
  accent?: boolean;
  delay?: string;
}) {
  return (
    <div className={`card animate-count-pop ${delay ?? ""} p-3 text-center`}>
      <div className={`text-xl font-bold ${accent ? "text-accent" : "text-ink"}`}>
        {value}
      </div>
      <div className="text-xs text-ink/60">{label}</div>
    </div>
  );
}
