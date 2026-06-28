import type { Attempt } from "@/types/attempt";
import type { MasteryRecord } from "@/types/mastery";
import type { ReviewSchedule } from "@/types/review";
import { CONCEPT_IDS, type ConceptId } from "@/types/concepts";
import { buildPool } from "@/features/quiz/pool";
import { DAY_MS } from "@/features/practice/spacedRepetition";

/**
 * Concept-level mastery strength: a single 0-100 signal per concept that the
 * rubric calls for. It blends four evidence sources, each grounded in data we
 * already store:
 *
 *  1. First-try accuracy on that concept's questions (retrieval strength).
 *  2. Spaced-repetition maturity (how many spaced reviews it has survived).
 *  3. Transfer: whether the concept has been demonstrated across multiple
 *     REPRESENTATIONS (graph, table, numeric, verbal) - recognition vs. real
 *     understanding. A concept cannot reach "Mastered" on one representation.
 *  4. Recency: a forgetting-curve decay so stale mastery softens over time.
 */

export type Representation = "graph" | "table" | "numeric" | "verbal";

export const REPRESENTATION_LABELS: Record<Representation, string> = {
  graph: "Graph",
  table: "Table",
  numeric: "Numeric",
  verbal: "Verbal",
};

export const ALL_REPRESENTATIONS: Representation[] = [
  "graph",
  "table",
  "numeric",
  "verbal",
];

export type StrengthLabel =
  | "New"
  | "Learning"
  | "Familiar"
  | "Strong"
  | "Mastered";

export interface ConceptStrength {
  conceptId: ConceptId;
  /** 0-100 overall mastery signal. */
  strength: number;
  label: StrengthLabel;
  /** First-try accuracy (0-1) across attempted questions of this concept. */
  accuracy: number;
  /** Distinct questions attempted for this concept. */
  attempted: number;
  /** Representations the learner has answered correctly in. */
  representations: Representation[];
  /** True once the concept is demonstrated in >= 2 representations. */
  transfer: boolean;
  /** A representation not yet demonstrated (a concrete "try this next"). */
  nextRepresentation?: Representation;
}

/** Map a question kind to the representation of slope it exercises. */
export function representationOf(kind: string): Representation {
  switch (kind) {
    case "observe":
    case "graph-target":
    case "number-line":
      return "graph";
    case "table-fill":
      return "table";
    case "numeric":
    case "slider":
      return "numeric";
    default:
      // choice, multi-select, order, categorize
      return "verbal";
  }
}

// Tunables.
const EVIDENCE_TARGET = 4; // attempts before we trust the accuracy signal
const REP_TARGET = 4; // spaced reviews to "graduate"
const MASTERED = 85;
const TRANSFER_CAP = 70; // can't exceed "Strong" without transfer

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function labelFor(strength: number, attempted: number): StrengthLabel {
  if (attempted === 0) return "New";
  if (strength >= MASTERED) return "Mastered";
  if (strength >= 60) return "Strong";
  if (strength >= 30) return "Familiar";
  return "Learning";
}

/** Forgetting-curve retention factor (0.55-1) given days since last practice. */
function retentionFactor(daysSince: number, intervalDays: number): number {
  if (!isFinite(daysSince) || daysSince <= 0) return 1;
  const horizon = Math.max(2, intervalDays * 1.5); // longer spacing = more durable
  return 0.55 + 0.45 * Math.exp(-daysSince / horizon);
}

interface ConceptIndex {
  /** solvableId -> the representation it uses. */
  repByStep: Map<string, Representation>;
  /** conceptId -> set of solvableIds tagged with it. */
  stepsByConcept: Map<ConceptId, Set<string>>;
}

function buildIndex(): ConceptIndex {
  const repByStep = new Map<string, Representation>();
  const stepsByConcept = new Map<ConceptId, Set<string>>();
  for (const { solvable } of buildPool()) {
    repByStep.set(solvable.id, representationOf(solvable.kind));
    for (const c of solvable.concepts) {
      const set = stepsByConcept.get(c) ?? new Set<string>();
      set.add(solvable.id);
      stepsByConcept.set(c, set);
    }
  }
  return { repByStep, stepsByConcept };
}

export function computeConceptStrength(
  conceptId: ConceptId,
  attempts: Attempt[],
  schedule: ReviewSchedule | null,
  record: MasteryRecord | null,
  index: ConceptIndex,
  now: number = Date.now()
): ConceptStrength {
  const stepIds = index.stepsByConcept.get(conceptId) ?? new Set<string>();

  // Group this concept's attempts by question, oldest -> newest.
  const byStep = new Map<string, Attempt[]>();
  for (const a of attempts) {
    if (!stepIds.has(a.stepId)) continue;
    const list = byStep.get(a.stepId) ?? [];
    list.push(a);
    byStep.set(a.stepId, list);
  }

  let firstTryCorrect = 0;
  const representations = new Set<Representation>();
  for (const [stepId, list] of byStep) {
    const ordered = [...list].sort(
      (x, y) => (x.createdAt?.toMillis() ?? 0) - (y.createdAt?.toMillis() ?? 0)
    );
    if (ordered[0]?.isCorrect) firstTryCorrect++;
    if (ordered.some((a) => a.isCorrect)) {
      const rep = index.repByStep.get(stepId);
      if (rep) representations.add(rep);
    }
  }

  const attempted = byStep.size;
  const accuracy = attempted ? firstTryCorrect / attempted : 0;
  const reps = schedule?.reps ?? 0;
  const transferCount = representations.size;

  const accuracyComp = accuracy;
  const repsComp = clamp01(reps / REP_TARGET);
  const transferComp = transferCount >= 2 ? 1 : transferCount / 2;
  const evidenceConf = clamp01(attempted / EVIDENCE_TARGET);

  let strength =
    100 * (0.55 * accuracyComp + 0.2 * repsComp + 0.25 * transferComp);
  // Don't let a concept claim high mastery on thin evidence.
  strength *= 0.5 + 0.5 * evidenceConf;

  // Forgetting-curve decay from the most recent practice signal.
  const lastMs = Math.max(
    schedule?.lastReviewedAt ?? 0,
    record?.lastPracticedAt?.toMillis?.() ?? 0
  );
  if (lastMs > 0) {
    const daysSince = (now - lastMs) / DAY_MS;
    strength *= retentionFactor(daysSince, schedule?.intervalDays ?? 1);
  }

  // Transfer gate: mastery requires more than one representation.
  if (transferCount < 2) strength = Math.min(strength, TRANSFER_CAP);

  strength = Math.round(Math.min(100, Math.max(0, strength)));

  const nextRepresentation = ALL_REPRESENTATIONS.find(
    (r) => !representations.has(r)
  );

  return {
    conceptId,
    strength,
    label: labelFor(strength, attempted),
    accuracy,
    attempted,
    representations: ALL_REPRESENTATIONS.filter((r) => representations.has(r)),
    transfer: transferCount >= 2,
    nextRepresentation: transferCount < 2 ? nextRepresentation : undefined,
  };
}

/** Strength for every tracked concept, in canonical concept order. */
export function computeAllStrengths(
  mastery: MasteryRecord[],
  attempts: Attempt[],
  schedules: ReviewSchedule[],
  now: number = Date.now()
): ConceptStrength[] {
  const index = buildIndex();
  const recordBy = new Map(mastery.map((m) => [m.conceptId, m]));
  const scheduleBy = new Map(schedules.map((s) => [s.conceptId, s]));
  return CONCEPT_IDS.map((id) =>
    computeConceptStrength(
      id,
      attempts,
      scheduleBy.get(id) ?? null,
      recordBy.get(id) ?? null,
      index,
      now
    )
  );
}
