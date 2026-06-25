import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { QuizSession } from "@/features/quiz/QuizSession";
import { buildPool, sample, dateSeed } from "@/features/quiz/pool";
import { AppHeader } from "@/components/AppHeader";

const DAILY_KEY = "bs.dailyDone";
const DAILY_COUNT = 5;
const DAILY_BONUS = 20;

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyChallengePage() {
  const seed = dateSeed();
  const questions = useMemo(
    () => sample(buildPool(), DAILY_COUNT, seed),
    [seed]
  );
  const [doneToday, setDoneToday] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    try {
      setDoneToday(localStorage.getItem(DAILY_KEY) === todayString());
    } catch {
      /* ignore */
    }
  }, []);

  function markDone() {
    try {
      localStorage.setItem(DAILY_KEY, todayString());
    } catch {
      /* ignore */
    }
    setDoneToday(true);
  }

  if (started) {
    return (
      <QuizSession
        title="Daily Challenge"
        badge="Daily"
        questions={questions}
        bonusXp={DAILY_BONUS}
        exitTo="/practice"
        onFinish={markDone}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-10 text-center sm:px-6">
        <div className="animate-scale-in flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-violet text-4xl shadow-pop">
          {String.fromCodePoint(0x1f4c5)}
        </div>
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold">Daily Challenge</h1>
          <p className="mt-1 text-sm text-ink/70">
            {DAILY_COUNT} questions, the same for everyone today. Finish for a{" "}
            <span className="font-semibold text-accent">+{DAILY_BONUS} XP</span> bonus.
          </p>
        </div>

        {doneToday ? (
          <div className="card animate-fade-in-up flex w-full flex-col items-center gap-3 p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-correct/15 text-correct">
              <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold">Done for today!</p>
            <p className="text-xs text-ink/60">Come back tomorrow for a fresh set.</p>
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="btn-ghost mt-1 w-full"
            >
              Replay (no bonus)
            </button>
            <Link to="/dashboard" className="text-sm font-semibold text-accent hover:underline">
              Back to dashboard
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="btn-primary w-full max-w-xs"
          >
            Start today&apos;s challenge
          </button>
        )}
      </main>
    </div>
  );
}
