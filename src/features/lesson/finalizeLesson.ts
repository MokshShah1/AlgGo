import { awardXp, fetchUserProfile, updateUserProfile } from "@/services/users";
import {
  fetchLessonProgress,
  markLessonCompleted,
} from "@/services/lessonProgress";
import { fetchAllMastery, saveMastery } from "@/services/mastery";
import { computeStreakOnGoalMet } from "@/features/scoring/streak";
import { computeMasteryUpdate } from "@/features/scoring/masteryRules";
import { PASS_THRESHOLD } from "@/features/course/progression";
import {
  LESSON_COMPLETION_BONUS,
  MASTERY_SUCCESS_THRESHOLD,
} from "@/features/scoring/constants";
import type { ConceptId } from "@/types/concepts";
import type { MasteryLevel } from "@/types/mastery";

export interface ConceptEvidence {
  evidenceDelta: number;
  misconceptions: string[];
  needsReview: boolean;
}

export interface FinalizeResult {
  bonusXp: number;
  streakCount: number;
  /** This session's score as a percentage (0-100). */
  score: number;
  /** Whether the learner has now passed this lesson (unlocks the next one). */
  passed: boolean;
}

/**
 * Persists everything that happens when a lesson is finished: streak update,
 * completion XP (first time only), mastery updates, and the completed status.
 * Per-solvable XP is awarded during play, so this avoids double counting on
 * replay by only granting the completion bonus and streak charge once.
 */
export async function finalizeLesson(params: {
  uid: string;
  lessonId: string;
  alreadyCompleted: boolean;
  correctCount: number;
  totalSolvables: number;
  xpEarned: number;
  completedStepIds: string[];
  conceptEvidence: Partial<Record<ConceptId, ConceptEvidence>>;
}): Promise<FinalizeResult> {
  const {
    uid,
    lessonId,
    alreadyCompleted,
    correctCount,
    totalSolvables,
    xpEarned,
    completedStepIds,
    conceptEvidence,
  } = params;

  const successRate = totalSolvables > 0 ? correctCount / totalSolvables : 0;

  // Streak (daily goal met by completing a lesson); grant a charge on first
  // completion only.
  const profile = await fetchUserProfile(uid);
  let streakCount = profile?.streakCount ?? 0;
  if (profile) {
    const streak = computeStreakOnGoalMet(profile, {
      grantCharge: !alreadyCompleted,
    });
    await updateUserProfile(uid, {
      streakCount: streak.streakCount,
      streakCharges: streak.streakCharges,
      lastStreakDate: streak.lastStreakDate,
    });
    streakCount = streak.streakCount;
  }

  // Completion bonus XP (first completion only).
  let bonusXp = 0;
  if (!alreadyCompleted) {
    bonusXp = LESSON_COMPLETION_BONUS;
    await awardXp(uid, bonusXp);
  }

  // Mastery updates from this session's evidence.
  const masteryList = await fetchAllMastery(uid);
  const entries = Object.entries(conceptEvidence) as [
    ConceptId,
    ConceptEvidence,
  ][];
  await Promise.all(
    entries.map(async ([conceptId, evidence]) => {
      const current = masteryList.find((m) => m.conceptId === conceptId) ?? null;
      const forceLevel: MasteryLevel | undefined =
        conceptId === "slope-ratio" && successRate >= MASTERY_SUCCESS_THRESHOLD
          ? 3
          : undefined;
      const update = computeMasteryUpdate(current, evidence, forceLevel);
      await saveMastery(uid, conceptId, update);
    })
  );

  // Score + pass gate. Pass status is sticky: once a lesson is passed it stays
  // passed even if a later replay scores lower, so the next lesson never
  // re-locks. The stored score keeps the learner's best.
  const prior = await fetchLessonProgress(uid, lessonId);
  const scoreThisRun = Math.round(successRate * 100);
  const passed = successRate >= PASS_THRESHOLD || (prior?.passed ?? false);
  const bestScore = Math.max(scoreThisRun, prior?.score ?? 0);

  await markLessonCompleted(uid, lessonId, {
    xpEarned: xpEarned + bonusXp,
    correctCount,
    completedStepIds,
    score: bestScore,
    passed,
  });

  return { bonusXp, streakCount, score: scoreThisRun, passed };
}
