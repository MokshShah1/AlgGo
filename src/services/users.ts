import {
  arrayUnion,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDb } from "@/lib/firebase";
import type { ComfortLevel, UserProfile } from "@/types/user";
import { currentWeekKey } from "@/lib/week";
import { computeStreakOnGoalMet, localDateKey } from "@/features/scoring/streak";
import { DAILY_GOAL_SOLVABLES } from "@/features/scoring/constants";
import { upsertLeaderboardEntry } from "@/services/leaderboard";

/**
 * User profile reads/writes for `users/{uid}` (PRD section 14).
 * Lesson progress, mastery, and attempts services are added in the data-layer
 * milestone.
 */

function userDocRef(uid: string) {
  return doc(getDb(), "users", uid);
}

export async function fetchUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/**
 * Creates the user document on first sign-in if it does not exist yet.
 * Returns the resulting profile.
 */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = userDocRef(user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    // Touch lastActiveAt so streak/recency logic has fresh data later.
    await updateDoc(ref, { lastActiveAt: serverTimestamp() });
    return snap.data() as UserProfile;
  }

  const newProfile = {
    uid: user.uid,
    displayName: user.displayName ?? "",
    email: user.email,
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
    streakCount: 0,
    streakCharges: 0,
    lastStreakDate: null,
    totalXp: 0,
    weeklyXp: 0,
    onboardingComplete: false,
    comfortLevel: null,
    avatarColor: "indigo",
    avatarEmoji: "",
    dailyGoal: 3,
    leaderboardOptIn: true,
    weekKey: currentWeekKey(),
    achievements: [],
  };

  await setDoc(ref, newProfile);

  // Re-read to resolve server timestamps into concrete values.
  const created = await getDoc(ref);
  return created.data() as UserProfile;
}

export async function completeOnboarding(
  uid: string,
  displayName: string,
  comfortLevel: ComfortLevel
): Promise<void> {
  await updateDoc(userDocRef(uid), {
    displayName: displayName.trim(),
    comfortLevel,
    onboardingComplete: true,
    lastActiveAt: serverTimestamp(),
  });
}

/**
 * Atomically adds XP to lifetime and weekly totals, rolling the weekly total
 * over at the start of each ISO week so "This week" actually resets.
 */
export async function awardXp(uid: string, amount: number): Promise<void> {
  if (amount === 0) return;
  const ref = userDocRef(uid);
  const week = currentWeekKey();
  type AwardAfter = {
    totalXp: number;
    weeklyXp: number;
    displayName: string;
    avatarColor?: string;
    avatarEmoji?: string;
    optedIn: boolean;
  };
  let after: AwardAfter | null = null;
  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as UserProfile | undefined;
    const sameWeek = data?.weekKey === week;
    const priorWeekly = sameWeek ? data?.weeklyXp ?? 0 : 0;
    const totalXp = (data?.totalXp ?? 0) + amount;
    const weeklyXp = priorWeekly + amount;
    tx.set(
      ref,
      {
        totalXp,
        weeklyXp,
        weekKey: week,
        lastActiveAt: serverTimestamp(),
      },
      { merge: true }
    );
    after = {
      totalXp,
      weeklyXp,
      displayName: data?.displayName ?? "",
      avatarColor: data?.avatarColor,
      avatarEmoji: data?.avatarEmoji,
      // Opt-out model: on the board unless the learner explicitly hid themselves.
      optedIn: data?.leaderboardOptIn !== false,
    };
  });

  // Keep the public leaderboard in sync for every learner the instant they earn
  // XP (so the board reflects all registered accounts, not only those who happen
  // to open the dashboard). Learners who hid themselves are left untouched.
  const result = after as AwardAfter | null;
  if (result && result.optedIn) {
    await upsertLeaderboardEntry({
      uid,
      displayName: result.displayName,
      weeklyXp: result.weeklyXp,
      totalXp: result.totalXp,
      avatarColor: result.avatarColor,
      avatarEmoji: result.avatarEmoji,
    }).catch(() => {});
  }
}

export interface ActivityResult {
  streakCount: number;
  streakCharges: number;
  /** True when this solvable pushed the learner to today's goal (streak bumped). */
  goalMet: boolean;
}

/**
 * Records one correctly-answered solvable toward the daily goal ("3 solvables
 * OR 1 lesson"). When the learner hits the solvable goal for the day, the daily
 * streak is advanced — so grinding Speed Round / practice keeps a streak alive,
 * not just finishing lessons. Idempotent per day for the streak bump.
 */
export async function recordSolvableActivity(
  uid: string
): Promise<ActivityResult | null> {
  const ref = userDocRef(uid);
  const today = localDateKey();
  return runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as UserProfile;

    const sameDay = data.dailySolveDate === today;
    const count = (sameDay ? data.dailySolveCount ?? 0 : 0) + 1;
    const alreadyCountedToday = data.lastStreakDate === today;

    const patch: Record<string, unknown> = {
      dailySolveDate: today,
      dailySolveCount: count,
      lastActiveAt: serverTimestamp(),
    };

    let streakCount = data.streakCount ?? 0;
    let streakCharges = data.streakCharges ?? 0;
    let goalMet = false;

    // Fire the streak once, the moment the solvable goal is reached.
    if (!alreadyCountedToday && count >= DAILY_GOAL_SOLVABLES) {
      const streak = computeStreakOnGoalMet(data, { today });
      patch.streakCount = streak.streakCount;
      patch.streakCharges = streak.streakCharges;
      patch.lastStreakDate = streak.lastStreakDate;
      streakCount = streak.streakCount;
      streakCharges = streak.streakCharges;
      goalMet = true;
    }

    tx.set(ref, patch, { merge: true });
    return { streakCount, streakCharges, goalMet };
  });
}

/** Persists newly unlocked achievement IDs (union, so re-unlocking is a no-op). */
export async function unlockAchievements(
  uid: string,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  await updateDoc(userDocRef(uid), {
    achievements: arrayUnion(...ids),
    lastActiveAt: serverTimestamp(),
  });
}

/**
 * Generic profile patch used by the scoring milestone to persist XP, streak,
 * and streak-charge changes. Always refreshes `lastActiveAt`.
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<
    Pick<
      UserProfile,
      | "streakCount"
      | "streakCharges"
      | "lastStreakDate"
      | "totalXp"
      | "weeklyXp"
      | "displayName"
      | "avatarColor"
      | "avatarEmoji"
      | "dailyGoal"
      | "placementDone"
      | "placementScore"
      | "leaderboardOptIn"
      | "dyslexiaFont"
      | "highContrast"
      | "theme"
      | "soundEnabled"
      | "achievements"
    >
  >
): Promise<void> {
  await updateDoc(userDocRef(uid), {
    ...data,
    lastActiveAt: serverTimestamp(),
  });
}
