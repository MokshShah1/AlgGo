import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PenLine, Check, AlertCircle, XCircle } from "lucide-react";
import { aiReasoning, type AiVerdict, type ProblemContext } from "@/lib/ai";

interface ReasoningBoxProps {
  problem: ProblemContext;
  wasCorrect: boolean;
}

const VERDICT_META: Record<
  AiVerdict,
  { label: string; cls: string; Icon: typeof Check }
> = {
  solid: { label: "Solid thinking", cls: "text-correct", Icon: Check },
  partial: { label: "Almost there", cls: "text-hint", Icon: AlertCircle },
  off: { label: "Let's rethink", cls: "text-danger", Icon: XCircle },
};

/**
 * Lets the learner explain their reasoning in words; the AI judges whether the
 * thinking (not just the final number) shows real understanding.
 */
export function ReasoningBox({ problem, wasCorrect }: ReasoningBoxProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ verdict: AiVerdict; feedback: string } | null>(null);
  const [error, setError] = useState(false);

  async function check() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(false);
    try {
      setResult(await aiReasoning(problem, text, wasCorrect));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 self-start text-xs font-semibold text-violet/90 transition-colors hover:text-violet"
      >
        <PenLine className="h-4 w-4" aria-hidden="true" />
        Explain your thinking
      </button>
    );
  }

  const meta = result ? VERDICT_META[result.verdict] : null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="flex flex-col gap-2 overflow-hidden rounded-card border border-violet/30 bg-violet/5 p-3"
    >
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-violet">
        <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
        Explain your thinking
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Why is that the answer? Type your reasoning…"
        className="w-full resize-none rounded-xl bg-surface-2 px-3 py-2 text-sm text-ink outline-none ring-violet/40 placeholder:text-ink/40 focus:ring-2"
      />

      <AnimatePresence>
        {result && meta && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-1 rounded-xl bg-surface px-3 py-2"
          >
            <span className={`flex items-center gap-1.5 text-xs font-bold ${meta.cls}`}>
              <meta.Icon className="h-4 w-4" aria-hidden="true" />
              {meta.label}
            </span>
            <p className="text-sm leading-snug text-ink/85">{result.feedback}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-xs text-danger">
          Couldn't reach the tutor. Make sure the AI server is running (npm run ai).
        </p>
      )}

      <button
        type="button"
        onClick={check}
        disabled={busy || !text.trim()}
        className="self-start rounded-pill bg-violet px-4 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
      >
        {busy ? "Checking…" : result ? "Check again" : "Check my reasoning"}
      </button>
    </motion.div>
  );
}
