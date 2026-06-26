import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";
import type { AiGeneratedProblem } from "@/lib/ai";

interface AiProblemRunnerProps {
  problems: AiGeneratedProblem[];
  onExit: () => void;
  /** Called when the learner finishes all problems, with the correct count. */
  onDone?: (correct: number, total: number) => void;
}

type Status = "idle" | "correct" | "wrong";

/** Evaluate a numeric/fraction answer string loosely (handles "2/3", decimals). */
function toNumber(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const frac = t.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = parseFloat(frac[2]);
    return d === 0 ? null : parseFloat(frac[1]) / d;
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function numericMatches(answer: string, guess: string): boolean {
  const a = answer.trim().toLowerCase();
  const g = guess.trim().toLowerCase();
  if (a === g) return true;
  const an = toNumber(answer);
  const gn = toNumber(guess);
  if (an === null || gn === null) return false;
  return Math.abs(an - gn) < 0.011;
}

/**
 * Plays a list of AI-generated problems (numeric or multiple-choice) with the
 * same look and feel as the rest of the app. Self-contained: client-side check,
 * explanation reveal, and a progress bar.
 */
export function AiProblemRunner({ problems, onExit, onDone }: AiProblemRunnerProps) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const problem = problems[index];
  const total = problems.length;

  if (!problem) {
    return (
      <div className="rounded-card border border-white/10 bg-surface p-6 text-center text-ink/70">
        No problems to show.
        <div className="mt-4">
          <button type="button" onClick={onExit} className="btn-ghost">
            Back
          </button>
        </div>
      </div>
    );
  }

  function check() {
    if (status === "correct") return;
    let ok = false;
    if (problem.kind === "choice") ok = selected === problem.correctIndex;
    else ok = problem.answer ? numericMatches(problem.answer, value) : false;
    if (ok) {
      setStatus("correct");
      setCorrectCount((c) => c + 1);
    } else {
      setStatus("wrong");
    }
  }

  function next() {
    if (index + 1 >= total) {
      setFinished(true);
      onDone?.(correctCount, total);
      return;
    }
    setIndex((i) => i + 1);
    setValue("");
    setSelected(null);
    setStatus("idle");
  }

  if (finished) {
    const pct = Math.round((correctCount / total) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 rounded-card border border-white/10 bg-surface p-8 text-center"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-violet text-white shadow-pop">
          <Sparkles className="h-8 w-8" />
        </span>
        <div>
          <p className="text-2xl font-extrabold text-ink">{pct}%</p>
          <p className="text-sm text-ink/60">
            {correctCount} of {total} correct
          </p>
        </div>
        <button type="button" onClick={onExit} className="btn-primary w-full max-w-xs">
          Done
        </button>
      </motion.div>
    );
  }

  const canCheck = problem.kind === "choice" ? selected !== null : value.trim() !== "";

  return (
    <div className="flex flex-col gap-5">
      <div className="h-1.5 w-full overflow-hidden rounded-pill bg-white/10">
        <div
          className="h-full rounded-pill bg-gradient-to-r from-accent to-violet transition-[width] duration-300"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-ink/50">
        Problem {index + 1} of {total}
      </span>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-4"
        >
          <p className="text-xl font-semibold leading-snug text-ink">{problem.prompt}</p>

          {problem.kind === "choice" ? (
            <div className="flex flex-col gap-2">
              {(problem.options ?? []).map((opt, i) => {
                const isSel = selected === i;
                const isAns = status !== "idle" && i === problem.correctIndex;
                const isWrongPick = status === "wrong" && isSel;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={status === "correct"}
                    onClick={() => {
                      setSelected(i);
                      if (status === "wrong") setStatus("idle");
                    }}
                    className={`rounded-card border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      isAns
                        ? "border-correct/60 bg-correct/10 text-ink"
                        : isWrongPick
                          ? "border-danger/60 bg-danger/10 text-ink"
                          : isSel
                            ? "border-accent bg-accent/10 text-ink"
                            : "border-white/10 bg-surface text-ink/80 hover:border-accent/40"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (status === "wrong") setStatus("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && canCheck && check()}
              disabled={status === "correct"}
              placeholder="Your answer"
              className="w-full rounded-card bg-surface-2 px-4 py-3 text-lg text-ink outline-none ring-accent/50 placeholder:text-ink/40 focus:ring-2"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {status !== "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col gap-1 rounded-card px-4 py-3 text-sm ${
            status === "correct" ? "bg-correct/10 text-ink" : "bg-danger/10 text-ink"
          }`}
        >
          <span
            className={`flex items-center gap-1.5 font-bold ${
              status === "correct" ? "text-correct" : "text-danger"
            }`}
          >
            {status === "correct" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {status === "correct" ? "Correct!" : "Not quite"}
          </span>
          {problem.explanation && (
            <p className="leading-snug text-ink/85">{problem.explanation}</p>
          )}
        </motion.div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onExit} className="btn-ghost flex-1">
          Exit
        </button>
        {status === "correct" || status === "wrong" ? (
          <button type="button" onClick={next} className="btn-primary flex-1">
            {index + 1 >= total ? "Finish" : "Next"}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={check}
            disabled={!canCheck}
            className="btn-primary flex-1"
          >
            Check
          </button>
        )}
      </div>
    </div>
  );
}
