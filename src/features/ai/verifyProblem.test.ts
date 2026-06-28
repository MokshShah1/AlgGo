import { describe, expect, it } from "vitest";
import {
  computeExpected,
  filterVerifiedProblems,
  parseNumeric,
  verifyProblem,
} from "@/features/ai/verifyProblem";
import type { AiGeneratedProblem } from "@/lib/ai";

describe("parseNumeric", () => {
  it("parses ints, decimals, fractions, and rejects junk", () => {
    expect(parseNumeric("3")).toBe(3);
    expect(parseNumeric("-2")).toBe(-2);
    expect(parseNumeric("2/4")).toBe(0.5);
    expect(parseNumeric("0.25")).toBe(0.25);
    expect(parseNumeric("x/0")).toBeNull();
    expect(parseNumeric("positive")).toBeNull();
    expect(parseNumeric("2/0")).toBeNull();
  });
});

describe("computeExpected", () => {
  it("computes each check type", () => {
    expect(computeExpected({ type: "slope_from_points", x1: 1, y1: 5, x2: 3, y2: 1 })).toBe(-2);
    expect(computeExpected({ type: "evaluate_linear", m: 2, b: -1, x: 2 })).toBe(3);
    expect(computeExpected({ type: "identify", field: "slope", m: 4, b: 7 })).toBe(4);
    expect(computeExpected({ type: "identify", field: "intercept", m: 4, b: 7 })).toBe(7);
    expect(computeExpected({ type: "rate", deltaY: 10, deltaX: 4 })).toBe(2.5);
  });

  it("rejects undefined slope and divide-by-zero", () => {
    expect(computeExpected({ type: "slope_from_points", x1: 2, y1: 1, x2: 2, y2: 9 })).toBeNull();
    expect(computeExpected({ type: "rate", deltaY: 5, deltaX: 0 })).toBeNull();
    // @ts-expect-error unknown type guarded at runtime
    expect(computeExpected({ type: "nope" })).toBeNull();
  });
});

describe("verifyProblem", () => {
  it("accepts a correct numeric problem", () => {
    const p: AiGeneratedProblem = {
      kind: "numeric",
      prompt: "Slope through (1,5) and (3,1)?",
      answer: "-2",
      check: { type: "slope_from_points", x1: 1, y1: 5, x2: 3, y2: 1 },
    };
    expect(verifyProblem(p).valid).toBe(true);
  });

  it("rejects a numeric problem whose stated answer is wrong", () => {
    const p: AiGeneratedProblem = {
      kind: "numeric",
      prompt: "Slope?",
      answer: "2", // actual is -2
      check: { type: "slope_from_points", x1: 1, y1: 5, x2: 3, y2: 1 },
    };
    expect(verifyProblem(p).valid).toBe(false);
  });

  it("rejects a problem with no check spec", () => {
    const p: AiGeneratedProblem = { kind: "numeric", prompt: "What is slope?", answer: "2" };
    expect(verifyProblem(p)).toMatchObject({ valid: false });
  });

  it("accepts a correct, unambiguous choice problem", () => {
    const p: AiGeneratedProblem = {
      kind: "choice",
      prompt: "Evaluate y = 2x - 1 at x = 2",
      options: ["1", "3", "5", "7"],
      correctIndex: 1,
      check: { type: "evaluate_linear", m: 2, b: -1, x: 2 },
    };
    expect(verifyProblem(p).valid).toBe(true);
  });

  it("rejects a choice problem where correctIndex points to the wrong option", () => {
    const p: AiGeneratedProblem = {
      kind: "choice",
      prompt: "Evaluate y = 2x - 1 at x = 2",
      options: ["1", "3", "5", "7"],
      correctIndex: 2, // 5 is wrong; answer is 3
      check: { type: "evaluate_linear", m: 2, b: -1, x: 2 },
    };
    expect(verifyProblem(p).valid).toBe(false);
  });

  it("rejects ambiguous choice options (two correct)", () => {
    const p: AiGeneratedProblem = {
      kind: "choice",
      prompt: "Evaluate y = 2x - 1 at x = 2",
      options: ["3", "3", "5"],
      correctIndex: 0,
      check: { type: "evaluate_linear", m: 2, b: -1, x: 2 },
    };
    expect(verifyProblem(p).valid).toBe(false);
  });

  it("filters a mixed batch down to only verified problems", () => {
    const good: AiGeneratedProblem = {
      kind: "numeric",
      prompt: "ok",
      answer: "3",
      check: { type: "evaluate_linear", m: 2, b: -1, x: 2 },
    };
    const bad: AiGeneratedProblem = {
      kind: "numeric",
      prompt: "bad",
      answer: "99",
      check: { type: "evaluate_linear", m: 2, b: -1, x: 2 },
    };
    const noCheck: AiGeneratedProblem = { kind: "numeric", prompt: "no", answer: "3" };
    expect(filterVerifiedProblems([good, bad, noCheck])).toEqual([good]);
  });
});
