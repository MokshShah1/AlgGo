import type { Timestamp } from "firebase/firestore";
import type { ConceptId } from "@/types/concepts";

/** 0 = not started, 1 = introduced, 2 = practicing, 3 = mastered. */
export type MasteryLevel = 0 | 1 | 2 | 3;

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  0: "Not started",
  1: "Introduced",
  2: "Practicing",
  3: "Mastered",
};

/** Mirrors Firestore document `users/{uid}/mastery/{conceptId}` (PRD section 14). */
export interface MasteryRecord {
  conceptId: ConceptId;
  level: MasteryLevel;
  evidenceCount: number;
  misconceptions: string[];
  lastPracticedAt: Timestamp | null;
  needsReview: boolean;
}

export type MasteryUpdate = Partial<
  Omit<MasteryRecord, "conceptId" | "lastPracticedAt">
>;
