import { updateUserProfile } from "@/services/users";
import { dayKey } from "@/features/progress/activity";
import type { UserProfile } from "@/types/user";

export type StreakState = "none" | "active-today" | "at-risk" | "broken";

export interface StreakStatus {
  state: StreakState;
  canRepair: boolean;
  charges: number;
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(fromStr: string, to: Date): number {
  const from = parseYmd(fromStr);
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / 86400000);
}

/** Classify the learner's streak relative to today. */
export function getStreakStatus(profile: UserProfile | null): StreakStatus {
  const charges = profile?.streakCharges ?? 0;
  if (!profile || !profile.lastStreakDate || (profile.streakCount ?? 0) === 0) {
    return { state: "none", canRepair: false, charges };
  }
  const diff = daysBetween(profile.lastStreakDate, new Date());
  if (diff <= 0) return { state: "active-today", canRepair: false, charges };
  if (diff === 1) return { state: "at-risk", canRepair: false, charges };
  return { state: "broken", canRepair: charges > 0, charges };
}

/**
 * Spend one streak charge to save a broken streak: backdate the last streak day
 * to yesterday so today's activity keeps the run alive.
 */
export async function repairStreak(
  uid: string,
  profile: UserProfile
): Promise<boolean> {
  const status = getStreakStatus(profile);
  if (!status.canRepair) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await updateUserProfile(uid, {
    lastStreakDate: dayKey(yesterday),
    streakCharges: Math.max(0, (profile.streakCharges ?? 0) - 1),
  });
  return true;
}
