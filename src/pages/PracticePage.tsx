import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useLearnerData } from "@/features/progress/useLearnerData";
import { fetchRecentAttempts } from "@/services/attempts";
import { fetchReviewSchedules, saveReviewSchedule } from "@/services/reviewSchedule";
import { buildReviewQueue } from "@/features/practice/reviewQueue";
import { applyReview, formatNextReview, isDue } from "@/features/practice/spacedRepetition";
import { QuizSession } from "@/features/quiz/QuizSession";
import { AppHeader } from "@/components/AppHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CONCEPT_LABELS, type ConceptId } from "@/types/concepts";
import type { Attempt } from "@/types/attempt";
import type { ReviewSchedule } from "@/types/review";
import type { PoolItem } from "@/features/quiz/pool";

const QUEUE_SIZE = 8;

export function PracticePage() {
  const { user } = useAuth();
  const { mastery, loading } = useLearnerData();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [schedules, setSchedules] = useState<ReviewSchedule[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [queue, setQueue] = useState<PoolItem[]>([]);

  // Live, mutable copy of each concept's schedule, updated as the learner
  // answers so consecutive answers compound correctly within a session.
  const scheduleMap = useRef<Map<ConceptId, ReviewSchedule>>(new Map());

  useEffect(() => {
    let active = true;
    if (!user) {
      setDataLoaded(true);
      return;
    }
    Promise.all([
      fetchRecentAttempts(user.uid, { max: 200 }),
      fetchReviewSchedules(user.uid),
    ])
      .then(([rows, scheds]) => {
        if (!active) return;
        setAttempts(rows);
        setSchedules(scheds);
        scheduleMap.current = new Map(scheds.map((s) => [s.conceptId, s]));
      })
      .catch(() => {})
      .finally(() => active && setDataLoaded(true));
    return () => {
      active = false;
    };
  }, [user]);

  function startSession() {
    setQueue(buildReviewQueue(mastery, attempts, QUEUE_SIZE, schedules));
    setStarted(true);
  }

  function handleAnswer({ concepts, correct }: { concepts: ConceptId[]; correct: boolean }) {
    if (!user) return;
    const now = Date.now();
    for (const concept of concepts) {
      const prev = scheduleMap.current.get(concept) ?? null;
      const next = applyReview(prev, concept, correct, now);
      scheduleMap.current.set(concept, next);
      saveReviewSchedule(user.uid, next).catch(() => {});
    }
    // Reflect the new schedule in the start-screen list after the session.
    setSchedules([...scheduleMap.current.values()]);
  }

  if (loading || !dataLoaded) {
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
        onAnswer={handleAnswer}
        onRestart={() => {
          setQueue(buildReviewQueue(mastery, attempts, QUEUE_SIZE, schedules));
          setRound((r) => r + 1);
        }}
      />
    );
  }

  // Per-concept schedule rows for the "what's coming back when" list.
  const rows = mastery
    .map((m) => ({
      conceptId: m.conceptId,
      schedule: schedules.find((s) => s.conceptId === m.conceptId) ?? null,
    }))
    .sort(
      (a, b) =>
        (a.schedule?.nextReviewAt ?? 0) - (b.schedule?.nextReviewAt ?? 0)
    );
  const dueCount = rows.filter((r) => isDue(r.schedule)).length;

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
            A spaced, interleaved {QUEUE_SIZE}-question set: concepts that are due
            come back first, mixed so no two of the same idea land in a row.
          </p>
          {dueCount > 0 && (
            <p className="mt-2 text-xs font-semibold text-hint">
              {dueCount} concept{dueCount === 1 ? "" : "s"} due for review
            </p>
          )}
        </div>

        {rows.length > 0 && (
          <div className="card w-full max-w-xs p-4 text-left">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink/60">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Review schedule
            </div>
            <ul className="flex flex-col gap-1.5">
              {rows.map((r) => {
                const due = isDue(r.schedule);
                return (
                  <li
                    key={r.conceptId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-ink/80">
                      {CONCEPT_LABELS[r.conceptId]}
                    </span>
                    <span
                      className={`shrink-0 rounded-pill px-2 py-0.5 text-xs font-semibold ${
                        due
                          ? "bg-hint/15 text-hint"
                          : "bg-correct/10 text-correct"
                      }`}
                    >
                      {formatNextReview(r.schedule)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <button type="button" onClick={startSession} className="btn-primary w-full max-w-xs">
          Start review
        </button>
        <Link to="/dashboard" className="text-sm font-semibold text-accent hover:underline">
          Back to dashboard
        </Link>
      </main>
    </div>
  );
}
