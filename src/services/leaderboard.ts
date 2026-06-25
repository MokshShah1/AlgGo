import {
  collection,
  doc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { currentWeekKey } from "@/lib/week";

/** Public, opt-in weekly XP leaderboard stored at `leaderboard/{uid}`. */

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  weeklyXp: number;
  totalXp: number;
  avatarColor?: string;
  avatarEmoji?: string;
  /** ISO week the `weeklyXp` belongs to; stale weeks are hidden from "This week". */
  weekKey?: string;
}

export type LeaderboardScope = "week" | "all";

function leaderboardCollection() {
  return collection(getDb(), "leaderboard");
}

/** Write/refresh the signed-in user's leaderboard entry (opt-in only). */
export async function upsertLeaderboardEntry(
  entry: LeaderboardEntry
): Promise<void> {
  await setDoc(
    doc(getDb(), "leaderboard", entry.uid),
    {
      uid: entry.uid,
      displayName: entry.displayName || "Anonymous learner",
      weeklyXp: entry.weeklyXp,
      totalXp: entry.totalXp,
      avatarColor: entry.avatarColor ?? "indigo",
      avatarEmoji: entry.avatarEmoji ?? "",
      weekKey: currentWeekKey(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Remove the user from the public board (opt-out). */
export async function removeLeaderboardEntry(uid: string): Promise<void> {
  await setDoc(
    doc(getDb(), "leaderboard", uid),
    { weeklyXp: -1, totalXp: -1, displayName: "(hidden)" },
    { merge: true }
  );
}

/** Top learners by weekly XP ("week") or lifetime XP ("all"). */
export async function fetchTopLeaderboard(
  scope: LeaderboardScope = "week",
  max = 25
): Promise<LeaderboardEntry[]> {
  const field = scope === "all" ? "totalXp" : "weeklyXp";
  const snap = await getDocs(
    query(leaderboardCollection(), orderBy(field, "desc"), fbLimit(max))
  );
  const week = currentWeekKey();
  return snap.docs
    .map((d) => d.data() as LeaderboardEntry)
    .filter((e) =>
      scope === "all"
        ? (e.totalXp ?? -1) >= 0
        : // "This week": every participant active this week shows up (including
          // those still at 0 XP) so a freshly-joined board isn't empty. Entries
          // from a previous week (stale weekKey) or hidden users (negative XP)
          // are excluded.
          (e.weeklyXp ?? -1) >= 0 && e.weekKey === week
    );
}

/**
 * The signed-in learner's rank within an already-fetched, scope-filtered list.
 * Rank is 1 + the number of entries whose XP is strictly greater than `xp`.
 * Computed client-side from the fetched page so weekly filtering stays correct
 * without extra composite indexes.
 */
export function rankWithin(
  entries: LeaderboardEntry[],
  scope: LeaderboardScope,
  xp: number
): number {
  const xpOf = (e: LeaderboardEntry) =>
    scope === "all" ? e.totalXp ?? 0 : e.weeklyXp;
  return 1 + entries.filter((e) => xpOf(e) > xp).length;
}
