import type { AiGeneratedProblem, ProblemCheck } from "@/lib/ai";

/**
 * Deterministic ground-truth verification for AI-generated problems.
 *
 * The model is required to attach a machine-checkable `check` spec to every
 * problem it generates. Here we RECOMPUTE the answer from that spec using plain
 * slope math and confirm the model's stated answer (or correct option) actually
 * matches. Anything we can't verify is rejected so a wrong "correct answer"
 * never reaches a learner — this is the math-engine ground-truth gate the
 * curriculum needs around generated content.
 */

const EPS = 0.011;

/** Parse "3", "-2", "2/3", "0.5" -> number, else null. */
export function parseNumeric(input: string | number | undefined | null): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;
  const t = input.trim();
  if (!t) return null;
  const frac = t.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const denom = parseFloat(frac[2]);
    if (denom === 0) return null;
    return parseFloat(frac[1]) / denom;
  }
  const n = parseFloat(t);
  return Number.isFinite(n) && /^-?\d*\.?\d+$/.test(t) ? n : null;
}

function valueMatches(expected: number, text: string | number | undefined): boolean {
  const got = parseNumeric(text ?? "");
  if (got === null) return false;
  return Math.abs(got - expected) < EPS;
}

/** Compute the ground-truth value for a check spec, or null if invalid. */
export function computeExpected(check: ProblemCheck | undefined): number | null {
  if (!check || typeof check !== "object") return null;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  switch (check.type) {
    case "slope_from_points": {
      const x1 = num(check.x1), y1 = num(check.y1), x2 = num(check.x2), y2 = num(check.y2);
      if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
      if (x2 - x1 === 0) return null; // undefined slope — not a clean numeric answer
      return (y2 - y1) / (x2 - x1);
    }
    case "evaluate_linear": {
      const m = num(check.m), b = num(check.b), x = num(check.x);
      if (m === null || b === null || x === null) return null;
      return m * x + b;
    }
    case "identify": {
      const m = num(check.m), b = num(check.b);
      if (m === null || b === null) return null;
      if (check.field === "slope") return m;
      if (check.field === "intercept") return b;
      return null;
    }
    case "rate": {
      const dy = num(check.deltaY), dx = num(check.deltaX);
      if (dy === null || dx === null || dx === 0) return null;
      return dy / dx;
    }
    default:
      return null;
  }
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
  expected?: number;
}

/** Verify a single generated problem against its check spec. */
export function verifyProblem(problem: AiGeneratedProblem): VerifyResult {
  if (!problem || typeof problem.prompt !== "string" || !problem.prompt.trim()) {
    return { valid: false, reason: "missing prompt" };
  }

  const expected = computeExpected(problem.check);
  if (expected === null) {
    return { valid: false, reason: "no machine-checkable spec" };
  }

  if (problem.kind === "numeric") {
    if (!valueMatches(expected, problem.answer)) {
      return { valid: false, reason: "answer does not match computed value", expected };
    }
    return { valid: true, expected };
  }

  if (problem.kind === "choice") {
    const options = problem.options ?? [];
    if (options.length < 2) return { valid: false, reason: "too few options", expected };
    const idx = problem.correctIndex;
    if (typeof idx !== "number" || idx < 0 || idx >= options.length) {
      return { valid: false, reason: "correctIndex out of range", expected };
    }
    // The marked-correct option must equal the computed value...
    if (!valueMatches(expected, options[idx])) {
      return { valid: false, reason: "correct option does not match computed value", expected };
    }
    // ...and it must be the ONLY option that does (no ambiguous sets).
    const matches = options.filter((o) => valueMatches(expected, o)).length;
    if (matches !== 1) {
      return { valid: false, reason: "ambiguous options", expected };
    }
    return { valid: true, expected };
  }

  return { valid: false, reason: "unsupported kind" };
}

/** Keep only the problems whose math we can independently confirm. */
export function filterVerifiedProblems(
  problems: AiGeneratedProblem[]
): AiGeneratedProblem[] {
  return problems.filter((p) => verifyProblem(p).valid);
}
