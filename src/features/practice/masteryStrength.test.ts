import { describe, expect, it } from "vitest";
import {
  computeAllStrengths,
  computeConceptStrength,
  representationOf,
} from "@/features/practice/masteryStrength";
import type { Attempt } from "@/types/attempt";
import type { ConceptId } from "@/types/concepts";

const NOW = 1_000_000_000_000;

function ts(ms: number) {
  return { toMillis: () => ms } as Attempt["createdAt"];
}
function attempt(stepId: string, isCorrect: boolean, at = NOW): Attempt {
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

// Synthetic content index so the test doesn't depend on real lesson data.
const concept = "rise" as ConceptId;
const index = {
  repByStep: new Map<string, ReturnType<typeof representationOf>>([
    ["g1", "graph"],
    ["g2", "graph"],
    ["t1", "table"],
    ["n1", "numeric"],
  ]),
  stepsByConcept: new Map<ConceptId, Set<string>>([
    [concept, new Set(["g1", "g2", "t1", "n1"])],
  ]),
};

describe("mastery strength", () => {
  it("maps question kinds to representations", () => {
    expect(representationOf("graph-target")).toBe("graph");
    expect(representationOf("table-fill")).toBe("table");
    expect(representationOf("numeric")).toBe("numeric");
    expect(representationOf("choice")).toBe("verbal");
  });

  it("is New with no attempts", () => {
    const s = computeConceptStrength(concept, [], null, null, index, NOW);
    expect(s.strength).toBe(0);
    expect(s.label).toBe("New");
    expect(s.transfer).toBe(false);
  });

  it("caps strength below mastery without transfer (single representation)", () => {
    // Four correct first-try, but all on the SAME representation (graph).
    const attempts = [
      attempt("g1", true),
      attempt("g2", true),
    ];
    const s = computeConceptStrength(concept, attempts, null, null, index, NOW);
    expect(s.transfer).toBe(false);
    expect(s.strength).toBeLessThanOrEqual(70);
    expect(s.nextRepresentation).toBeDefined();
  });

  it("rewards transfer across representations", () => {
    const oneRep = computeConceptStrength(
      concept,
      [attempt("g1", true), attempt("g2", true)],
      null,
      null,
      index,
      NOW
    );
    const twoReps = computeConceptStrength(
      concept,
      [attempt("g1", true), attempt("t1", true)],
      null,
      null,
      index,
      NOW
    );
    expect(twoReps.transfer).toBe(true);
    expect(twoReps.strength).toBeGreaterThan(oneRep.strength);
    expect(twoReps.representations).toEqual(
      expect.arrayContaining(["graph", "table"])
    );
  });

  it("computes a strength for every concept", () => {
    const all = computeAllStrengths([], [], [], NOW);
    expect(all).toHaveLength(7);
    expect(all.every((s) => s.strength === 0 && s.label === "New")).toBe(true);
  });
});
