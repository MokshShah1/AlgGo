import type { Timestamp } from "firebase/firestore";

/** Mirrors Firestore document `users/{uid}/attempts/{attemptId}` (PRD section 14). */
export interface Attempt {
  id?: string;
  lessonId: string;
  stepId: string;
  answer: string;
  isCorrect: boolean;
  attemptNumber: number;
  misconceptionTag: string | null;
  createdAt: Timestamp | null;
}

/** Payload for logging a new attempt; createdAt is set server-side. */
export type NewAttempt = Omit<Attempt, "id" | "createdAt">;
