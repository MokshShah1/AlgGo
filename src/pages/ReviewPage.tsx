import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { fetchRecentAttempts } from "@/services/attempts";
import { course, getLesson } from "@/content/course";
import { AppHeader } from "@/components/AppHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { Attempt } from "@/types/attempt";
import type { Solvable } from "@/types/lesson";

/** Look up the prompt text for a given lesson/step so attempts read clearly. */
function stepPrompt(lessonId: string, stepId: string): string {
  const lesson = getLesson(lessonId);
  const solvable: Solvable | undefined = lesson?.solvables.find(
    (s) => s.id === stepId
  );
  return solvable?.prompt ?? stepId;
}

function formatWhen(attempt: Attempt): string {
  const date = attempt.createdAt?.toDate?.();
  if (!date) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface LessonGroup {
  lessonId: string;
  title: string;
  order: number;
  attempts: Attempt[];
  correct: number;
  lastAt: number;
}

export function ReviewPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLesson, setOpenLesson] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      const rows = await fetchRecentAttempts(user.uid, { max: 300 });
      if (active) {
        setAttempts(rows);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user]);

  const groups = useMemo<LessonGroup[]>(() => {
    const byLesson = new Map<string, Attempt[]>();
    for (const a of attempts) {
      const list = byLesson.get(a.lessonId) ?? [];
      list.push(a);
      byLesson.set(a.lessonId, list);
    }
    const result: LessonGroup[] = [];
    for (const [lessonId, list] of byLesson) {
      const lesson = getLesson(lessonId);
      const sorted = [...list].sort(
        (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
      );
      result.push({
        lessonId,
        title: lesson?.title ?? lessonId,
        order: lesson?.order ?? 999,
        attempts: sorted,
        correct: list.filter((a) => a.isCorrect).length,
        lastAt: sorted[0]?.createdAt?.toMillis() ?? 0,
      });
    }
    return result.sort((a, b) => b.lastAt - a.lastAt);
  }, [attempts]);

  if (loading) return <LoadingScreen label="Loading your review..." />;

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-4xl md:py-8">
        <div className="animate-fade-in-up flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            Your history
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">Review &amp; redo</h1>
          <p className="text-sm text-ink/70">
            Revisit every answer you&apos;ve given and replay any lesson to lock
            it in.
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-ink/70">
              No attempts yet. Once you start answering questions they&apos;ll
              show up here.
            </p>
            <Link to="/course" className="btn-primary">
              Browse lessons
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group, i) => {
              const isOpen = openLesson === group.lessonId;
              const total = group.attempts.length;
              const accuracy = Math.round((group.correct / total) * 100);
              const replayable = (getLesson(group.lessonId)?.solvables.length ?? 0) > 0;
              return (
                <section
                  key={group.lessonId}
                  className="card animate-fade-in-up flex h-fit flex-col gap-3 p-5"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                        Lesson {group.order}
                      </p>
                      <h2 className="font-bold leading-tight">{group.title}</h2>
                    </div>
                    {replayable && (
                      <Link
                        to={`/lesson/${group.lessonId}`}
                        className="btn-primary shrink-0 px-4 py-2 text-sm"
                      >
                        Redo
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-pill bg-surface-2 px-3 py-1 font-semibold text-ink/70">
                      {total} attempts
                    </span>
                    <span className="rounded-pill bg-correct/15 px-3 py-1 font-semibold text-correct">
                      {accuracy}% correct
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenLesson(isOpen ? null : group.lessonId)
                    }
                    className="self-start text-sm font-semibold text-accent hover:underline"
                  >
                    {isOpen ? "Hide attempts" : "See all attempts"}
                  </button>

                  {isOpen && (
                    <ul className="flex flex-col gap-2 border-t border-white/5 pt-3">
                      {group.attempts.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-start gap-3 rounded-card bg-surface-2 p-3"
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                              a.isCorrect
                                ? "bg-correct/20 text-correct"
                                : "bg-danger/20 text-danger"
                            }`}
                            aria-hidden="true"
                          >
                            {a.isCorrect ? "\u2713" : "\u2717"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs text-ink/60">
                              {stepPrompt(a.lessonId, a.stepId)}
                            </p>
                            <p className="text-sm font-medium">
                              Your answer:{" "}
                              <span
                                className={
                                  a.isCorrect ? "text-correct" : "text-danger"
                                }
                              >
                                {a.answer || "(interaction)"}
                              </span>
                            </p>
                            <p className="text-[11px] text-ink/40">
                              Try {a.attemptNumber}
                              {formatWhen(a) ? ` \u00b7 ${formatWhen(a)}` : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-ink/40">
          Showing your most recent {attempts.length} attempts across{" "}
          {course.lessons.length} lessons.
        </p>
      </main>
    </div>
  );
}
