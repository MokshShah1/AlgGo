import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Compass, Sparkles } from "lucide-react";
import { aiAvailable, aiCoach } from "@/lib/ai";
import { CONCEPT_LABELS } from "@/types/concepts";
import type { ConceptId } from "@/types/concepts";

interface MasteryLike {
  conceptId: ConceptId;
  level: number;
  needsReview?: boolean;
}

interface CoachCardProps {
  mastery: MasteryLike[];
  streak?: number;
}

/**
 * "What should I study next" — a dashboard card that reads the learner's mastery
 * data and explains, in plain English, what to do next. Renders nothing if the
 * AI proxy isn't available.
 */
export function CoachCard({ mastery, streak }: CoachCardProps) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!(await aiAvailable())) {
        if (active) setHidden(true);
        return;
      }
      const weakConcepts = mastery
        .filter((m) => m.needsReview || m.level < 2)
        .map((m) => CONCEPT_LABELS[m.conceptId] ?? m.conceptId);
      const masteryPayload = mastery.map((m) => ({
        concept: CONCEPT_LABELS[m.conceptId] ?? m.conceptId,
        level: m.level,
      }));
      try {
        const reply = await aiCoach({ mastery: masteryPayload, weakConcepts, streak });
        if (active) setText(reply);
      } catch {
        if (active) setHidden(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (hidden) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative overflow-hidden p-5"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-violet text-white shadow-soft">
          <Compass className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
          Your AI coach
        </h2>
        <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
      </div>
      {loading ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="h-3.5 w-full animate-pulse rounded-full bg-white/10" />
          <div className="h-3.5 w-4/5 animate-pulse rounded-full bg-white/10" />
        </div>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-ink/85">{text}</p>
      )}
    </motion.section>
  );
}
