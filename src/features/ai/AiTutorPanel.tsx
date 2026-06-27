import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, X } from "lucide-react";
import { aiTutor, type ChatMessage, type ProblemContext } from "@/lib/ai";
import { AI_NAME } from "@/lib/aiPersona";

interface AiTutorPanelProps {
  problem: ProblemContext;
  onClose: () => void;
}

const SUGGESTIONS = [
  "I don't get how to start",
  "Explain it more simply",
  "Why was my answer wrong?",
  "Give me a hint",
];

/**
 * A chat panel where the learner can ask the AI tutor about the current
 * problem. Grounded in the problem context; falls back gracefully if the AI
 * proxy is unreachable.
 */
export function AiTutorPanel({ problem, onClose }: AiTutorPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await aiTutor(problem, next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setError(`${AI_NAME} is offline right now. Make sure the AI server is running (npm run ai).`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-[80dvh] w-full max-w-md flex-col overflow-hidden rounded-t-card bg-canvas shadow-pop sm:h-[70dvh] sm:rounded-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-surface px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-violet text-white shadow-soft">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">{AI_NAME}</span>
              <span className="text-[11px] text-ink/55">Your AI coach · here to help</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/60 transition-colors hover:text-ink"
            aria-label="Close tutor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink/70">
                Stuck on this one? Ask me anything about it — I'll walk you through it.
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-pill border border-white/10 bg-surface px-3 py-1.5 text-xs font-medium text-ink/80 transition-colors hover:border-accent/50 hover:text-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3.5 py-2 text-sm text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-2 px-3.5 py-2 text-sm text-ink"
                  }
                >
                  {m.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {busy && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface-2 px-3.5 py-3">
                <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-card bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
          )}
        </div>

        {/* Composer */}
        <form
          className="flex items-center gap-2 border-t border-white/10 bg-surface px-3 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${AI_NAME}…`}
            className="flex-1 rounded-pill bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none ring-accent/50 placeholder:text-ink/40 focus:ring-2"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-opacity disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <motion.span
      className="h-1.5 w-1.5 rounded-full bg-ink/50"
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 0.9, repeat: Infinity, delay }}
    />
  );
}
