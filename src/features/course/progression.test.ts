import { describe, expect, it } from "vitest";
import {
  PASS_THRESHOLD,
  isLessonUnlocked,
  placementStartIndex,
  startIndexForRatio,
  unlockedThroughIndex,
} from "@/features/course/progression";
import { course } from "@/content/course";
import type { LessonProgress } from "@/types/progress";
import type { UserProfile } from "@/types/user";

const ids = course.lessons.map((l) => l.id);
const lastIndex = course.lessons.length - 1;

function makeProgress(
  lessonId: string,
  overrides: Partial<LessonProgress> = {}
): LessonProgress {
  return {
    lessonId,
    status: "completed",
    currentStepIndex: 0,
    completedStepIds: [],
    attempts: 1,
    correctCount: 8,
    wrongCount: 2,
    xpEarned: 25,
    score: 80,
    passed: true,
    startedAt: null,
    updatedAt: null,
    completedAt: null,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    uid: "u1",
    displayName: "Maya",
    email: "maya@example.com",
    createdAt: null,
    lastActiveAt: null,
    streakCount: 0,
    streakCharges: 0,
    lastStreakDate: null,
    totalXp: 0,
    weeklyXp: 0,
    onboardingComplete: true,
    comfortLevel: "new",
    ...overrides,
  };
}

describe("PASS_THRESHOLD", () => {
  it("requires 80% correct", () => {
    expect(PASS_THRESHOLD).toBe(0.8);
  });
});

describe("startIndexForRatio", () => {
  it("places weak placements at the very start", () => {
    expect(startIndexForRatio(0)).toBe(0);
    expect(startIndexForRatio(0.39)).toBe(0);
  });

  it("places mid placements a couple lessons in", () => {
    expect(startIndexForRatio(0.4)).toBe(2);
    expect(startIndexForRatio(0.69)).toBe(2);
  });

  it("places strong placements further in", () => {
    expect(startIndexForRatio(0.7)).toBe(4);
    expect(startIndexForRatio(1)).toBe(4);
  });

  it("never returns an index past the last lesson", () => {
    expect(startIndexForRatio(1)).toBeLessThanOrEqual(lastIndex);
  });
});

describe("placementStartIndex", () => {
  it("is 0 when no placement has been taken", () => {
    expect(placementStartIndex(null)).toBe(0);
    expect(placementStartIndex(makeProfile())).toBe(0);
  });

  it("maps the placement score (0-100) through startIndexForRatio", () => {
    expect(
      placementStartIndex(makeProfile({ placementDone: true, placementScore: 80 }))
    ).toBe(4);
    expect(
      placementStartIndex(makeProfile({ placementDone: true, placementScore: 50 }))
    ).toBe(2);
    expect(
      placementStartIndex(makeProfile({ placementDone: true, placementScore: 10 }))
    ).toBe(0);
  });
});

describe("unlockedThroughIndex (exercises isPassed)", () => {
  it("unlocks only the first lesson for a brand-new learner", () => {
    expect(unlockedThroughIndex([], null)).toBe(0);
  });

  it("advances the frontier one lesson per passed lesson", () => {
    const progress = [makeProgress(ids[0], { passed: true })];
    expect(unlockedThroughIndex(progress, null)).toBe(1);
  });

  it("does not advance past a lesson that was completed but not passed", () => {
    const progress = [makeProgress(ids[0], { passed: false, score: 50 })];
    expect(unlockedThroughIndex(progress, null)).toBe(0);
  });

  it("treats legacy completions (no passed field) as passed", () => {
    const progress = [makeProgress(ids[0], { passed: undefined })];
    expect(unlockedThroughIndex(progress, null)).toBe(1);
  });

  it("does not count in-progress lessons as passed", () => {
    const progress = [makeProgress(ids[0], { status: "in_progress", passed: undefined })];
    expect(unlockedThroughIndex(progress, null)).toBe(0);
  });

  it("starts the frontier from the placement index", () => {
    const profile = makeProfile({ placementDone: true, placementScore: 80 });
    expect(unlockedThroughIndex([], profile)).toBe(4);
  });
});

describe("isLessonUnlocked", () => {
  it("unlocks the first lesson and locks the second for a new learner", () => {
    expect(isLessonUnlocked(ids[0], [], null)).toBe(true);
    expect(isLessonUnlocked(ids[1], [], null)).toBe(false);
  });

  it("unlocks the next lesson once the current one is passed", () => {
    const progress = [makeProgress(ids[0], { passed: true })];
    expect(isLessonUnlocked(ids[1], progress, null)).toBe(true);
    expect(isLessonUnlocked(ids[2], progress, null)).toBe(false);
  });

  it("returns false for an unknown lesson id", () => {
    expect(isLessonUnlocked("does-not-exist", [], null)).toBe(false);
  });
});
