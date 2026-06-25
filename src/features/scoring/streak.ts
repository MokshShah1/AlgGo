import type { UserProfile } from "@/types/user";
import { MAX_STREAK_CHARGES } from "@/features/scoring/constants";

/** Local-time date key (YYYY-MM-DD) so streaks respect the learner's timezone. */
export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayDifference(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export interface StreakUpdate {
  streakCount: number;
  streakCharges: number;
  lastStreakDate: string;
}

/**
 * Applies the daily-goal-met streak rules (PRD section 15):
 * - same day: no duplicate increment
 * - yesterday: increment
 * - missed day(s) with a charge: consume one charge and preserve (increment)
 * - missed day(s) with no charge: reset to 1
 *
 * `grantCharge` adds a streak charge (up to the max) for completing a lesson.
 */
export function computeStreakOnGoalMet(
  profile: Pick<
    UserProfile,
    "streakCount" | "streakCharges" | "lastStreakDate"
  >,
  options: { grantCharge?: boolean; today?: string } = {}
): StreakUpdate {
  const today = options.today ?? localDateKey();
  const last = profile.lastStreakDate;
  let streakCount = profile.streakCount ?? 0;
  let streakCharges = profile.streakCharges ?? 0;

  if (!last) {
    streakCount = 1;
  } else {
    const diff = dayDifference(last, today);
    if (diff <= 0) {
      // Already counted today (or clock skew) - no duplicate increment.
    } else if (diff === 1) {
      streakCount += 1;
    } else {
      // Missed one or more days.
      if (streakCharges > 0) {
        streakCharges -= 1;
        streakCount += 1;
      } else {
        streakCount = 1;
      }
    }
  }

  if (options.grantCharge && streakCharges < MAX_STREAK_CHARGES) {
    streakCharges += 1;
  }

  return { streakCount, streakCharges, lastStreakDate: today };
}
