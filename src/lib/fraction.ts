/** Small rational-number helpers shared by the graph and answer validators. */

export interface Fraction {
  num: number;
  den: number;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

/** Reduces a fraction and normalizes the sign onto the numerator. */
export function simplify(num: number, den: number): Fraction {
  if (den === 0) return { num, den: 0 };
  const g = gcd(num, den);
  let n = num / g;
  let d = den / g;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  return { num: n, den: d };
}

/** Formats a slope from rise/run, e.g. "2/3", "-1/2", "2", or "undefined". */
export function formatSlope(rise: number, run: number): string {
  if (run === 0) return "undefined";
  const { num, den } = simplify(rise, run);
  return den === 1 ? `${num}` : `${num}/${den}`;
}

/**
 * Parses a learner's answer into a numeric value.
 * Accepts integers, decimals, and fractions like "2/3" or "-1/2".
 * Returns null when the input is empty or not a valid number/fraction.
 */
export function parseNumeric(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const fractionMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    if (denominator === 0) return null;
    return numerator / denominator;
  }

  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/**
 * Normalizes an answer string for matching against authored wrong-answer rules.
 * Collapses whitespace and reduces fractions so "4 / -2" matches "-2".
 */
export function normalizeAnswer(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "");
  const fractionMatch = trimmed.match(/^(-?\d+)\/(-?\d+)$/);
  if (fractionMatch) {
    const { num, den } = simplify(
      Number(fractionMatch[1]),
      Number(fractionMatch[2])
    );
    return den === 1 ? `${num}` : `${num}/${den}`;
  }
  return trimmed;
}
