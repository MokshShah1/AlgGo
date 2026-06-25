import type { Timestamp } from "firebase/firestore";

/** Learner's self-reported comfort with slope, captured during onboarding. */
export type ComfortLevel = "new" | "confusing" | "challenge";

export const COMFORT_OPTIONS: { value: ComfortLevel; label: string }[] = [
  { value: "new", label: "I'm new to slope" },
  { value: "confusing", label: "I've seen slope but it's confusing" },
  { value: "challenge", label: "I'm ready for a challenge" },
];

/**
 * Mirrors Firestore document `users/{uid}` (PRD section 14).
 * Timestamps are Firestore `Timestamp` once read back from the server.
 */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  createdAt: Timestamp | null;
  lastActiveAt: Timestamp | null;
  streakCount: number;
  streakCharges: number;
  lastStreakDate: string | null; // YYYY-MM-DD in the user's local time
  totalXp: number;
  weeklyXp: number;
  onboardingComplete: boolean;
  comfortLevel: ComfortLevel | null;
  /** Personalization (optional; older docs may not have these). */
  avatarColor?: string;
  avatarEmoji?: string;
  /** Daily goal: number of solvables to complete per day. */
  dailyGoal?: number;
  /** Placement diagnostic. */
  placementDone?: boolean;
  placementScore?: number;
  /** Opt-in to the weekly XP leaderboard. */
  leaderboardOptIn?: boolean;
  /** Accessibility + display preferences (synced across devices). */
  dyslexiaFont?: boolean;
  highContrast?: boolean;
  theme?: "dark" | "light";
  soundEnabled?: boolean;
  /** ISO week the `weeklyXp` total belongs to (e.g. "2026-W26"). */
  weekKey?: string;
  /** Daily-goal streak tracking for the "3 solvables" rule. */
  dailySolveDate?: string; // YYYY-MM-DD
  dailySolveCount?: number;
  /** IDs of achievements the learner has unlocked (persisted for the dopamine hit). */
  achievements?: string[];
}
