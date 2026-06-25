import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { updateUserProfile } from "@/services/users";
import { buildPool, itemDifficulty, shuffle, type PoolItem } from "@/features/quiz/pool";
import { course } from "@/content/course";
import { QuizSession, type QuizResult } from "@/features/quiz/QuizSession";
import { startIndexForRatio } from "@/features/course/progression";
import { AppHeader } from "@/components/AppHeader";

/** Build a short adaptive-feeling set: a spread across difficulties. */
function buildDiagnostic(): PoolItem[] {
  const pool = buildPool();
  const byDiff: Record<number, PoolItem[]> = { 1: [], 2: [], 3: [] };
  for (const item of pool) byDiff[itemDifficulty(item)].push(item);
  const pick = (d: number, n: number) => shuffle(byDiff[d]).slice(0, n);
  return [...pick(1, 1), ...pick(2, 2), ...pick(3, 2)];
}

export function DiagnosticPage() {
  const { user, refreshProfile } = useAuth();
  const questions = useMemo(buildDiagnostic, []);
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");
  const [result, setResult] = useState<QuizResult | null>(null);

  async function handleFinish(r: QuizResult) {
    setResult(r);
    setPhase("result");
    if (user) {
      const ratio = r.total > 0 ? r.score / r.total : 0;
      try {
        await updateUserProfile(user.uid, {
          placementDone: true,
          placementScore: Math.round(ratio * 100),
        });
        await refreshProfile();
      } catch {
        /* non-fatal */
      }
    }
  }

  if (phase === "quiz") {
    return (
      <QuizSession
        title="Placement"
        badge="Placement"
        questions={questions}
        exitTo="/dashboard"
        onFinish={handleFinish}
      />
    );
  }

  if (phase === "result" && result) {
    const ratio = result.total > 0 ? result.score / result.total : 0;
    const lesson = course.lessons[startIndexForRatio(ratio)];
    return (
      <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
        <AppHeader />
        <main className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-10 text-center sm:px-6">
          <div className="animate-scale-in flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-violet text-3xl font-extrabold text-white shadow-pop">
            {Math.round(ratio * 100)}%
          </div>
          <div className="animate-fade-in-up">
            <h1 className="text-2xl font-bold">You&apos;re all set!</h1>
            <p className="mt-1 text-sm text-ink/70">
              Based on your answers, we recommend starting here:
            </p>
          </div>
          <div className="card w-full p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              Lesson {lesson.order}
            </p>
            <h2 className="mt-1 text-lg font-bold">{lesson.title}</h2>
            <p className="mt-1 text-sm text-ink/70">{lesson.description}</p>
            <Link to={`/lesson/${lesson.id}`} className="btn-primary mt-4 w-full">
              Start this lesson
            </Link>
          </div>
          <Link to="/dashboard" className="text-sm font-semibold text-accent hover:underline">
            Go to dashboard
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-10 text-center sm:px-6">
        <div className="animate-scale-in flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky to-violet text-4xl shadow-pop">
          {String.fromCodePoint(0x1f9ed)}
        </div>
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold">Quick placement quiz</h1>
          <p className="mt-1 text-sm text-ink/70">
            Answer {questions.length} questions so we can recommend the best
            starting point for you. Takes about 2 minutes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPhase("quiz")}
          className="btn-primary w-full max-w-xs"
        >
          Start placement
        </button>
        <Link to="/dashboard" className="text-sm font-semibold text-accent hover:underline">
          Skip for now
        </Link>
      </main>
    </div>
  );
}
