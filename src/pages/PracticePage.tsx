import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useLearnerData } from "@/features/progress/useLearnerData";
import { fetchRecentAttempts } from "@/services/attempts";
import { buildReviewQueue } from "@/features/practice/reviewQueue";
import { QuizSession } from "@/features/quiz/QuizSession";
import { AppHeader } from "@/components/AppHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { Attempt } from "@/types/attempt";

const QUEUE_SIZE = 8;

export function PracticePage() {
  const { user } = useAuth();
  const { mastery, loading } = useLearnerData();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [attemptsLoaded, setAttemptsLoaded] = useState(false);
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user) {
      setAttemptsLoaded(true);
      return;
    }
    fetchRecentAttempts(user.uid, { max: 200 })
      .then((rows) => active && setAttempts(rows))
      .catch(() => {})
      .finally(() => active && setAttemptsLoaded(true));
    return () => {
      active = false;
    };
  }, [user]);

  const queue = useMemo(
    () => buildReviewQueue(mastery, attempts, QUEUE_SIZE),
    // Rebuild on a new round so a fresh top-up is sampled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mastery, attempts, round]
  );

  if (loading || !attemptsLoaded) {
    return <LoadingScreen label="Building your review queue..." />;
  }

  if (started) {
    return (
      <QuizSession
        key={round}
        title="Smart Review"
        badge="Review"
        questions={queue}
        exitTo="/practice"
        onRestart={() => {
          setRound((r) => r + 1);
        }}
      />
    );
  }

  const weakCount = mastery.filter((m) => m.needsReview || m.level < 2).length;

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-10 text-center sm:px-6">
        <div className="animate-scale-in flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky to-accent text-4xl shadow-pop">
          {String.fromCodePoint(0x1f9e0)}
        </div>
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold">Smart Review</h1>
          <p className="mt-1 text-sm text-ink/70">
            A {QUEUE_SIZE}-question set tuned to your weak spots and recent
            mistakes, so you practice exactly what you need.
          </p>
          {weakCount > 0 && (
            <p className="mt-2 text-xs font-semibold text-hint">
              {weakCount} concept{weakCount === 1 ? "" : "s"} flagged for review
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="btn-primary w-full max-w-xs"
        >
          Start review
        </button>
        <Link to="/dashboard" className="text-sm font-semibold text-accent hover:underline">
          Back to dashboard
        </Link>
      </main>
    </div>
  );
}
