import type { Timestamp } from "firebase/firestore";

export type LessonStatus = "not_started" | "in_progress" | "completed";

/**
 * Mirrors Firestore document `users/{uid}/lessonProgress/{lessonId}`
 * (PRD section 14).
 */
export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  currentStepIndex: number;
  completedStepIds: string[];
  attempts: number;
  correctCount: number;
  wrongCount: number;
  xpEarned: number;
  /** Best score on this lesson (0-100), set on completion. */
  score?: number;
  /** Whether the learner reached the pass threshold (unlocks the next lesson). */
  passed?: boolean;
  startedAt: Timestamp | null;
  updatedAt: Timestamp | null;
  completedAt: Timestamp | null;
}

/** Fields that callers may write; identity/timestamps are managed by services. */
export type LessonProgressUpdate = Partial<
  Omit<LessonProgress, "lessonId" | "updatedAt">
>;
