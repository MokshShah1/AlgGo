import type { Attempt } from "@/types/attempt";

/** Local YYYY-MM-DD key for a date (used to bucket daily activity). */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Count attempts per local day. */
export function buildActivity(attempts: Attempt[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const a of attempts) {
    const date = a.createdAt?.toDate?.();
    if (!date) continue;
    const key = dayKey(date);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

/** Unique correctly-solved steps completed today (for the daily goal). */
export function solvedToday(attempts: Attempt[]): number {
  const today = dayKey(new Date());
  const ids = new Set<string>();
  for (const a of attempts) {
    if (!a.isCorrect) continue;
    const date = a.createdAt?.toDate?.();
    if (!date || dayKey(date) !== today) continue;
    ids.add(`${a.lessonId}:${a.stepId}`);
  }
  return ids.size;
}
