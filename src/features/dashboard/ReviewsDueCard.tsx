import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Brain, CheckCircle2 } from "lucide-react";

/**
 * Compact "N reviews due" card linking to Smart Review. When nothing is due it
 * shows a subtle "all caught up" confirmation instead of nagging.
 */
export function ReviewsDueCard({ count }: { count: number }) {
  const caughtUp = count <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
    >
      {caughtUp ? (
        <div className="flex items-center gap-3 rounded-card border border-correct/30 bg-correct/10 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-correct/20 text-correct">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">You're all caught up</p>
            <p className="text-xs text-ink/60">No reviews due right now — nice work.</p>
          </div>
        </div>
      ) : (
        <Link
          to="/smart-review"
          className="flex items-center justify-between gap-3 rounded-card border border-violet/30 bg-violet/10 p-4 transition-transform hover:-translate-y-0.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-sky text-white shadow-soft">
              <Brain className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">
                {count} review{count === 1 ? "" : "s"} due
              </p>
              <p className="text-xs text-ink/60">
                Smart Review targets your weak spots.
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-violet" aria-hidden="true" />
        </Link>
      )}
    </motion.div>
  );
}
