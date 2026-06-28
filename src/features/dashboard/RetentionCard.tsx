import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";
import type { RetentionStats } from "@/features/practice/retention";

/**
 * "Show the effect" card for the learning-science layer: surfaces first-try
 * accuracy and, more importantly, how many previously-missed steps the learner
 * has recovered through spaced, interleaved review. Hidden until there's enough
 * data to be meaningful.
 */
export function RetentionCard({ stats }: { stats: RetentionStats }) {
  if (stats.totalSteps < 3) return null;

  const firstTry = Math.round(stats.firstTryRate * 100);
  const recovered = Math.round(stats.recoveredRate * 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="card p-5"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-correct to-sky text-white shadow-soft">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-ink">Learning that sticks</h2>
          <p className="text-xs text-ink/60">How review is moving the needle</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-extrabold text-ink">{firstTry}%</div>
          <div className="text-xs text-ink/60">
            first-try accuracy across {stats.totalSteps} questions
          </div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-correct">
            {stats.recoveredSteps}/{stats.missedSteps}
          </div>
          <div className="text-xs text-ink/60">
            missed questions recovered through review
          </div>
        </div>
      </div>

      {stats.missedSteps > 0 && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-correct to-sky transition-[width] duration-700"
              style={{ width: `${recovered}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-ink/60">
            {recovered}% of the concepts you got wrong, you&apos;ve since gotten right.
          </p>
        </div>
      )}
    </motion.section>
  );
}
