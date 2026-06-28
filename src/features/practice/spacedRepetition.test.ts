import { describe, expect, it } from "vitest";
import {
  DAY_MS,
  applyReview,
  dueConceptIds,
  formatNextReview,
  isDue,
} from "@/features/practice/spacedRepetition";
import { computeRetention } from "@/features/practice/retention";
import type { ReviewSchedule } from "@/types/review";
import type { MasteryRecord } from "@/types/mastery";
import type { Attempt } from "@/types/attempt";

const NOW = 1_000_000_000_000;

function ts(ms: number) {
  return { toMillis: () => ms } as Attempt["createdAt"];
}

function attempt(stepId: string, isCorrect: boolean, at: number): Attempt {
  return {
    stepId,
    lessonId: "l",
    answer: "",
    isCorrect,
    attemptNumber: 1,
    misconceptionTag: null,
    createdAt: ts(at),
  };
}

describe("spaced repetition scheduling", () => {
  it("grows the interval on consecutive correct reviews", () => {
    const a = applyReview(null, "rise", true, NOW);
    expect(a.intervalDays).toBe(1);
    const b = applyReview(a, "rise", true, NOW);
    expect(b.intervalDays).toBe(3);
    const c = applyReview(b, "rise", true, NOW);
    expect(c.intervalDays).toBeGreaterThan(3);
    expect(c.nextReviewAt).toBe(NOW + c.intervalDays * DAY_MS);
  });

  it("collapses the interval and counts a lapse on a miss", () => {
    const grown = applyReview(applyReview(null, "rise", true, NOW), "rise", true, NOW);
    const missed = applyReview(grown, "rise", false, NOW);
    expect(missed.intervalDays).toBe(1); // resurfaces sooner
    expect(missed.reps).toBe(0);
    expect(missed.lapses).toBe(1);
    expect(missed.nextReviewAt).toBe(NOW + DAY_MS);
  });

  it("treats no schedule, or a past due time, as due", () => {
    expect(isDue(null, NOW)).toBe(true);
    const future = applyReview(null, "rise", true, NOW);
    expect(isDue(future, NOW)).toBe(false);
    expect(isDue(future, NOW + 2 * DAY_MS)).toBe(true);
  });

  it("surfaces due + weak concepts but not untouched ones", () => {
    const mastery: MasteryRecord[] = [
      { conceptId: "rise", level: 1, needsReview: true } as MasteryRecord,
      { conceptId: "run", level: 3, needsReview: false } as MasteryRecord,
    ];
    const schedules: ReviewSchedule[] = [
      {
        conceptId: "run",
        intervalDays: 5,
        ease: 2.4,
        reps: 3,
        lapses: 0,
        lastReviewedAt: NOW,
        nextReviewAt: NOW + 5 * DAY_MS,
      },
    ];
    const due = dueConceptIds(mastery, schedules, NOW);
    expect(due).toContain("rise"); // weak, unscheduled
    expect(due).not.toContain("run"); // scheduled, not yet due
  });

  it("formats next-review labels", () => {
    expect(formatNextReview(null, NOW)).toBe("due now");
    const s = applyReview(null, "rise", true, NOW);
    expect(formatNextReview(s, NOW)).toBe("tomorrow");
  });
});

describe("retention metric", () => {
  it("counts a miss that was later corrected as recovered", () => {
    const attempts: Attempt[] = [
      attempt("s1", false, NOW),
      attempt("s1", true, NOW + 1000),
      attempt("s2", true, NOW), // first try correct
    ];
    const stats = computeRetention(attempts);
    expect(stats.totalSteps).toBe(2);
    expect(stats.missedSteps).toBe(1);
    expect(stats.recoveredSteps).toBe(1);
    expect(stats.recoveredRate).toBe(1);
    expect(stats.firstTryRate).toBe(0.5);
  });
});
