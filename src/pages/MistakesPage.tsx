import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { fetchRecentAttempts } from "@/services/attempts";
import { getLesson } from "@/content/course";
import { QuizSession } from "@/features/quiz/QuizSession";
import { AppHeader } from "@/components/AppHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { Attempt } from "@/types/attempt";
import type { Solvable } from "@/types/lesson";
import type { PoolItem } from "@/features/quiz/pool";

interface MistakeEntry {
  lessonId: string;
  stepId: string;
  answer: string;
  prompt: string;
  explanation: string;
  lessonTitle: string;
  solvable?: Solvable;
}

export function MistakesPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [practicing, setPracticing] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchRecentAttempts(user.uid, { max: 300 })
      .then((rows) => active && setAttempts(rows))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  // Most-recent wrong answer per step that has no later correct answer.
  const mistakes = useMemo<MistakeEntry[]>(() => {
    const sorted = [...attempts].sort(
      (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
    );
    const solvedLater = new Set<string>();
    const seen = new Set<string>();
    const result: MistakeEntry[] = [];
    for (const a of sorted) {
      const key = `${a.lessonId}:${a.stepId}`;
      if (a.isCorrect) {
        solvedLater.add(key);
        continue;
      }
      if (seen.has(key) || solvedLater.has(key)) continue;
      seen.add(key);
      const lesson = getLesson(a.lessonId);
      const solvable = lesson?.solvables.find((s) => s.id === a.stepId);
      if (!solvable) continue; // generated/word-problem items have no record
      result.push({
        lessonId: a.lessonId,
        stepId: a.stepId,
        answer: a.answer,
        prompt: solvable.prompt,
        explanation: solvable.explanation,
        lessonTitle: lesson?.title ?? a.lessonId,
        solvable,
      });
    }
    return result;
  }, [attempts]);

  const practiceItems = useMemo<PoolItem[]>(
    () =>
      mistakes
        .filter((m) => m.solvable)
        .map((m) => ({ lessonId: m.lessonId, solvable: m.solvable! })),
    [mistakes]
  );

  if (loading) return <LoadingScreen label="Loading your mistakes..." />;

  if (practicing && practiceItems.length > 0) {
    return (
      <QuizSession
        title="Mistake Practice"
        badge="Fix it"
        questions={practiceItems}
        exitTo="/mistakes"
        exitLabel="Done"
      />
    );
  }

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-4xl md:py-8">
        <div className="animate-fade-in-up flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            Mistake notebook
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">Learn from misses</h1>
          <p className="text-sm text-ink/70">
            Every question you haven&apos;t yet gotten right, with the
            explanation. Practice them until they&apos;re gone.
          </p>
        </div>

        {mistakes.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-correct/15 text-correct">
              <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
            </span>
            <p className="text-sm text-ink/70">
              No outstanding mistakes. Nice work keeping your notebook clean!
            </p>
            <Link to="/course" className="btn-primary">
              Keep learning
            </Link>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPracticing(true)}
              className="btn-primary w-full sm:w-auto sm:self-start"
            >
              Practice all {mistakes.length}
            </button>
            <div className="grid gap-3 md:grid-cols-2">
              {mistakes.map((m, i) => (
                <section
                  key={`${m.lessonId}:${m.stepId}`}
                  className="card animate-fade-in-up flex flex-col gap-2 p-5"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    {m.lessonTitle}
                  </p>
                  <p className="text-sm font-semibold leading-snug">{m.prompt}</p>
                  <p className="text-xs text-ink/60">
                    Your answer:{" "}
                    <span className="font-semibold text-danger">
                      {m.answer || "(interaction)"}
                    </span>
                  </p>
                  <p className="rounded-card bg-surface-2 p-3 text-xs text-ink/80">
                    {m.explanation}
                  </p>
                  <Link
                    to={`/lesson/${m.lessonId}`}
                    className="self-start text-sm font-semibold text-accent hover:underline"
                  >
                    Open lesson
                  </Link>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
