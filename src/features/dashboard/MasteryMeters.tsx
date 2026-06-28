import { motion } from "motion/react";
import { Check, Layers } from "lucide-react";
import { CONCEPT_LABELS } from "@/types/concepts";
import {
  ALL_REPRESENTATIONS,
  REPRESENTATION_LABELS,
  type ConceptStrength,
  type StrengthLabel,
} from "@/features/practice/masteryStrength";

const BAR: Record<StrengthLabel, string> = {
  Mastered: "bg-gradient-to-r from-accent to-violet",
  Strong: "bg-accent",
  Familiar: "bg-sky",
  Learning: "bg-hint",
  New: "bg-ink/20",
};

const TAG: Record<StrengthLabel, string> = {
  Mastered: "bg-violet/15 text-violet",
  Strong: "bg-accent/15 text-accent",
  Familiar: "bg-sky/15 text-sky",
  Learning: "bg-hint/15 text-hint",
  New: "bg-ink/10 text-ink/50",
};

/**
 * Concept mastery meters: a 0-100 strength signal per concept plus the
 * representations it's been demonstrated in. This is the "clear mastery signal"
 * - it makes visible that mastery means understanding slope across graphs,
 * tables, numbers, and words, not just one familiar question type.
 */
export function MasteryMeters({ strengths }: { strengths: ConceptStrength[] }) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
          Concept mastery
        </h2>
        <span className="flex items-center gap-1 text-xs text-ink/50">
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          across representations
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {strengths.map((s, i) => (
          <motion.div
            key={s.conceptId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-medium text-ink">
                {CONCEPT_LABELS[s.conceptId]}
              </span>
              <span
                className={`shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-bold ${TAG[s.label]}`}
              >
                {s.label}
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                <div
                  className={`h-full rounded-full ${BAR[s.label]} transition-[width] duration-700`}
                  style={{ width: `${s.strength}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-ink/70">
                {s.strength}
              </span>
            </div>

            {/* Representation chips: filled = demonstrated correctly. */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {ALL_REPRESENTATIONS.map((rep) => {
                const got = s.representations.includes(rep);
                return (
                  <span
                    key={rep}
                    className={`flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-semibold ${
                      got
                        ? "bg-correct/15 text-correct"
                        : "bg-ink/5 text-ink/35"
                    }`}
                  >
                    {got && <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />}
                    {REPRESENTATION_LABELS[rep]}
                  </span>
                );
              })}
              {!s.transfer && s.attempted > 0 && s.nextRepresentation && (
                <span className="text-[10px] font-medium text-ink/45">
                  try it as a {REPRESENTATION_LABELS[s.nextRepresentation].toLowerCase()} to master it
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
