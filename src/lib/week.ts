import type { UserProfile } from "@/types/user";

/**
 * ISO-8601 week key in the learner's local time, e.g. "2026-W26".
 * Used to roll the weekly XP total over at the start of each week so the
 * "This week" leaderboard actually resets instead of accumulating forever.
 */
export function currentWeekKey(date = new Date()): string {
  // Copy so we don't mutate the caller's date.
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // ISO weeks start on Monday; shift so Thursday determines the year.
  const day = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
  d.setDate(d.getDate() - day + 3); // move to Thursday of this week
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  const week =
    1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * The learner's weekly XP for the *current* week. A stored `weeklyXp` from a
 * previous week (the rollover only happens lazily on the next XP award) counts
 * as 0 this week.
 */
export function effectiveWeeklyXp(
  profile?: Pick<UserProfile, "weeklyXp" | "weekKey"> | null
): number {
  if (!profile) return 0;
  if (profile.weekKey !== currentWeekKey()) return 0;
  return profile.weeklyXp ?? 0;
}
