import type { Solvable } from "@/types/lesson";
import { course } from "@/content/course";

export interface PoolItem {
  lessonId: string;
  solvable: Solvable;
}

/** Every solvable across the course, tagged with its lesson id. */
export function buildPool(): PoolItem[] {
  const pool: PoolItem[] = [];
  for (const lesson of course.lessons) {
    for (const solvable of lesson.solvables) {
      pool.push({ lessonId: lesson.id, solvable });
    }
  }
  return pool;
}

/** Difficulty (1-3) for a pool item: authored, else derived from position. */
export function itemDifficulty(item: PoolItem): 1 | 2 | 3 {
  if (item.solvable.difficulty) return item.solvable.difficulty;
  const lesson = course.lessons.find((l) => l.id === item.lessonId);
  if (!lesson) return 2;
  const idx = lesson.solvables.findIndex((s) => s.id === item.solvable.id);
  const total = lesson.solvables.length;
  if (total <= 1) return 1;
  const r = idx / (total - 1);
  return r < 0.34 ? 1 : r < 0.67 ? 2 : 3;
}

/** Deterministic PRNG so "daily" challenges are identical for everyone. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dateSeed(d = new Date()): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function sample(items: PoolItem[], n: number, seed?: number): PoolItem[] {
  const rng = seed === undefined ? Math.random : mulberry32(seed);
  return shuffle(items, rng).slice(0, Math.min(n, items.length));
}

/**
 * Interleaving (a learning-science technique): reorder a set of items so the
 * same primary concept does not appear twice in a row where avoidable. This
 * forces the learner to choose the right approach each time instead of riding
 * the momentum of the previous question. The set of items is preserved; only
 * the order changes.
 */
export function interleaveByConcept(items: PoolItem[]): PoolItem[] {
  const primary = (it: PoolItem) => it.solvable.concepts[0] ?? it.solvable.kind;
  const remaining = [...items];
  const result: PoolItem[] = [];
  let last: string | null = null;

  while (remaining.length) {
    let idx = remaining.findIndex((it) => primary(it) !== last);
    if (idx === -1) idx = 0; // only same-concept items left; accept a repeat
    const [picked] = remaining.splice(idx, 1);
    result.push(picked);
    last = primary(picked);
  }
  return result;
}

/**
 * Pick the unused item whose difficulty is closest to `target` (1-3).
 * A little jitter keeps repeated sessions from feeling identical.
 */
export function pickClosest(
  items: PoolItem[],
  target: number,
  usedIds: Set<string>
): PoolItem | undefined {
  let best: PoolItem | undefined;
  let bestScore = Infinity;
  for (const it of items) {
    if (usedIds.has(it.solvable.id)) continue;
    const score = Math.abs(itemDifficulty(it) - target) + Math.random() * 0.4;
    if (score < bestScore) {
      bestScore = score;
      best = it;
    }
  }
  return best;
}
