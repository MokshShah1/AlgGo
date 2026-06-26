import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { QuizSession } from "@/features/quiz/QuizSession";
import { buildPool, sample, dateSeed } from "@/features/quiz/pool";
import { AppHeader } from "@/components/AppHeader";
import { AiProblemRunner } from "@/features/ai/AiProblemRunner";
import { useLearnerData } from "@/features/progress/useLearnerData";
import { CONCEPT_LABELS } from "@/types/concepts";
import { aiAvailable, aiDaily, type AiGeneratedProblem } from "@/lib/ai";

const DAILY_KEY = "bs.dailyDone";
const DAILY_COUNT = 5;
const DAILY_BONUS = 20;

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

type AiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "playing"; problems: AiGeneratedProblem[] };

export function DailyChallengePage() {
  const seed = dateSeed();
  const questions = useMemo(
    () => sample(buildPool(), DAILY_COUNT, seed),
    [seed]
  );
  const [doneToday, setDoneToday] = useState(false);
  const [started, setStarted] = useState(false);

  const { mastery } = useLearnerData();
  const weakConcepts = useMemo(
    () =>
      mastery
        .filter((m) => m.needsReview || m.level < 2)
        .map((m) => CONCEPT_LABELS[m.conceptId] ?? m.conceptId),
    [mastery]
  );

  const [aiOffered, setAiOffered] = useState(false);
  const [ai, setAi] = useState<AiState>({ status: "idle" });

  useEffect(() => {
    try {
      setDoneToday(localStorage.getItem(DAILY_KEY) === todayString());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let active = true;
    aiAvailable()
      .then((ok) => {
        if (active) setAiOffered(ok);
      })
      .catch(() => {
        /* ignore: AI simply stays hidden */
      });
    return () => {
      active = false;
    };
  }, []);

  function markDone() {
    try {
      localStorage.setItem(DAILY_KEY, todayString());
    } catch {
      /* ignore */
    }
    setDoneToday(true);
  }

  async function startAi() {
    setAi({ status: "loading" });
    try {
      const problems = await aiDaily(weakConcepts, [], DAILY_COUNT);
      if (!problems.length) {
        setAi({
          status: "error",
          message: "The AI couldn't build a set right now. Try the daily challenge below.",
        });
        return;
      }
      setAi({ status: "playing", problems });
    } catch {
      setAi({
        status: "error",
        message: "Something went wrong reaching the AI. Try the daily challenge below.",
      });
    }
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

  if (ai.status === "playing") {
    return (
      <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
        <AppHeader />
        <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-accent">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Personalized for you
          </div>
          <AiProblemRunner
            problems={ai.problems}
            onExit={() => setAi({ status: "idle" })}
          />
        </main>
      </div>
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

        {aiOffered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="card flex w-full flex-col items-center gap-3 border border-accent/30 bg-gradient-to-br from-accent/5 to-violet/5 p-5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-violet text-white shadow-pop">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Personalize with AI</p>
              <p className="mt-0.5 text-xs text-ink/60">
                A fresh {DAILY_COUNT}-question set tuned to
                {weakConcepts.length > 0
                  ? " the concepts you're still working on."
                  : " your recent practice."}
              </p>
            </div>
            <button
              type="button"
              onClick={startAi}
              disabled={ai.status === "loading"}
              className="btn-primary w-full max-w-xs"
            >
              {ai.status === "loading" ? (
                "Building your set…"
              ) : (
                <>
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  Personalize with AI
                </>
              )}
            </button>
            {ai.status === "error" && (
              <p className="text-xs font-medium text-ink/70">{ai.message}</p>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
