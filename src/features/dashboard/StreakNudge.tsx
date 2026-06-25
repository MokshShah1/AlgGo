import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Flame, PartyPopper, ArrowRight } from "lucide-react";
import type { UserProfile } from "@/types/user";
import { getStreakStatus } from "@/features/scoring/streakRepair";

/**
 * In-app come-back nudge (no push notifications).
 *
 * - At-risk: the learner has a live streak whose last day is yesterday-or-older
 *   and they haven't met today's goal yet — encourage them to keep it alive.
 * - Met goal: a small positive confirmation that today's run is safe.
 *
 * Renders nothing when there's no streak to protect, so we never nag.
 */
export function StreakNudge({
  profile,
  doneToday,
  dailyGoal,
}: {
  profile: UserProfile | null;
  doneToday: number;
  dailyGoal: number;
}) {
  const streakCount = profile?.streakCount ?? 0;
  if (!profile || streakCount <= 0) return null;

  const status = getStreakStatus(profile);
  const metGoal = doneToday >= dailyGoal;
  const remaining = Math.max(0, dailyGoal - doneToday);

  // Streak is in danger today and the daily goal isn't met yet.
  const atRisk = !metGoal && (status.state === "at-risk" || status.state === "broken");

  if (atRisk) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Link
          to="/daily"
          className="flex items-center justify-between gap-3 rounded-card border border-hint/40 bg-hint/10 p-4 transition-transform hover:-translate-y-0.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-hint to-danger text-white shadow-soft">
              <Flame className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">
                Keep your {streakCount}-day streak alive
              </p>
              <p className="text-xs text-ink/65">
                Do {remaining} more solvable{remaining === 1 ? "" : "s"} today to stay on track.
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-hint" aria-hidden="true" />
        </Link>
      </motion.div>
    );
  }

  // Already met today's goal — a subtle confirmation.
  if (metGoal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex items-center gap-3 rounded-card border border-correct/30 bg-correct/10 p-4"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-correct/20 text-correct">
          <PartyPopper className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">
            {streakCount}-day streak safe for today
          </p>
          <p className="text-xs text-ink/60">Goal met — see you again tomorrow.</p>
        </div>
      </motion.div>
    );
  }

  return null;
}
