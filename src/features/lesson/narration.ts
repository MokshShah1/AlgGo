/**
 * Narration script builder — shared by the runtime player (VideoLesson) and the
 * build-time pre-render pipeline (scripts/build-tts.mjs).
 *
 * Every "teach me" walkthrough is derived purely from a solvable's authored
 * content, so the exact set of spoken lines is known ahead of time and can be
 * pre-rendered to audio files. Keep this module free of React / browser-only
 * APIs so it can run under Node too.
 */

import type { Lesson, Solvable } from "@/types/lesson";

/** Default narration voice (must match the build pipeline + runtime fallback). */
export const NARRATION_VOICE = "af_heart";

/**
 * Stable, dependency-free id for a single spoken line (FNV-1a, hex). The same
 * function runs in Node (to name the file) and the browser (to find it), so the
 * pre-rendered clip and the runtime lookup always agree.
 */
export function lineId(text: string, voice: string = NARRATION_VOICE): string {
  const input = `${voice}\n${text}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Build a spoken walkthrough from the solvable's authored content. */
export function buildScript(lesson: Lesson, solvable: Solvable): string[] {
  const out: string[] = [];
  out.push("Okay, let's break this one down together.");
  out.push(cleanForSpeech(solvable.prompt));

  if (lesson.keyIdea) {
    out.push(`Here's the key idea. ${cleanForSpeech(lesson.keyIdea)}`);
  }

  for (const sentence of splitSentences(solvable.explanation)) {
    out.push(cleanForSpeech(sentence));
  }

  const answer = answerLine(solvable);
  if (answer) out.push(answer);

  out.push(cleanForSpeech(solvable.correctFeedback));
  out.push("Now give it another try. You've got this!");

  // Drop empties and collapse accidental repeats of the same sentence.
  return out
    .map((l) => l.trim())
    .filter((l, i, arr) => l.length > 0 && (i === 0 || l !== arr[i - 1]));
}

function answerLine(solvable: Solvable): string | null {
  switch (solvable.kind) {
    case "numeric": {
      const a = solvable.acceptedAnswers[0];
      return a ? `So the answer is ${spokenNumber(a)}.` : null;
    }
    case "choice": {
      const correct = solvable.options.find(
        (o) => o.id === solvable.correctOptionId
      );
      return correct ? `The correct choice is: ${correct.label}.` : null;
    }
    case "graph-target": {
      const { rise, run } = solvable.targetSlope;
      return `Drag point B until the slope equals ${fractionPhrase(
        String(rise),
        String(run)
      )}.`;
    }
    default:
      return null;
  }
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Common fractions spoken as words; everything else falls back to "a over b". */
const FRACTIONS: Record<string, string> = {
  "1/2": "one half",
  "1/3": "one third",
  "2/3": "two thirds",
  "1/4": "one quarter",
  "3/4": "three quarters",
  "1/5": "one fifth",
  "2/5": "two fifths",
};

function spokenInt(value: string): string {
  return value.startsWith("-") ? `negative ${value.slice(1)}` : value;
}

function fractionPhrase(numRaw: string, den: string): string {
  const neg = numRaw.startsWith("-");
  const num = neg ? numRaw.slice(1) : numRaw;
  const words = FRACTIONS[`${num}/${den}`] ?? `${num} over ${den}`;
  return neg ? `negative ${words}` : words;
}

/**
 * Turn authored math text into something a TTS voice reads naturally:
 * coordinates, fractions, exponents, operators, comparisons and negatives.
 */
export function cleanForSpeech(text: string): string {
  let s = text;

  // Strip markdown emphasis / code ticks.
  s = s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`/g, "");

  // Normalize unicode dashes / minus to a plain hyphen.
  s = s.replace(/[\u2212\u2013\u2014]/g, "-");

  // Coordinate pairs: (2, -3) -> "the point 2 comma negative 3".
  s = s.replace(
    /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g,
    (_m, a, b) => `the point ${spokenInt(a)} comma ${spokenInt(b)}`
  );

  // Exponents.
  s = s
    .replace(/\u00b2/g, " squared")
    .replace(/\u00b3/g, " cubed")
    .replace(/\^\s*2\b/g, " squared")
    .replace(/\^\s*3\b/g, " cubed")
    .replace(/\^\s*(\d+)/g, " to the power of $1");

  // Greek letters, roots, operators and comparison symbols.
  s = s
    .replace(/\u0394/g, "change in ")
    .replace(/\u221a/g, "square root of ")
    .replace(/\u03c0/g, " pi ")
    .replace(/\u00d7/g, " times ")
    .replace(/\u00f7/g, " divided by ")
    .replace(/\u00b7/g, " times ")
    .replace(/\u00b1/g, " plus or minus ")
    .replace(/\u2264/g, " is less than or equal to ")
    .replace(/\u2265/g, " is greater than or equal to ")
    .replace(/\u2248/g, " approximately ")
    .replace(/\u2260/g, " is not equal to ")
    .replace(/%/g, " percent")
    .replace(/\u00b0/g, " degrees");

  // Fractions like 3/4 or -1/2 -> spoken words.
  s = s.replace(/(-?\d+)\s*\/\s*(\d+)/g, (_m, n, d) => fractionPhrase(n, d));

  // y = mx + b reads better with a space in "mx".
  s = s.replace(/\bmx\b/g, "m x");

  // ASCII comparisons (after fractions so we don't touch any digit/digit).
  s = s
    .replace(/\s*<=\s*/g, " is less than or equal to ")
    .replace(/\s*>=\s*/g, " is greater than or equal to ")
    .replace(/\s*<\s*/g, " is less than ")
    .replace(/\s*>\s*/g, " is greater than ");

  // Subtraction (digit - digit) vs. negative value (-digit).
  s = s.replace(/(\d)\s*-\s*(\d)/g, "$1 minus $2");
  s = s.replace(/(^|[\s(=])-(\d)/g, "$1negative $2");

  // Remaining arithmetic glue.
  s = s
    .replace(/=/g, " equals ")
    .replace(/\+/g, " plus ")
    .replace(/\*/g, " times ")
    .replace(/\//g, " over ");

  // Tidy spacing/punctuation.
  return s
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function spokenNumber(value: string): string {
  const v = value.trim();
  const frac = v.match(/^(-?\d+)\/(\d+)$/);
  if (frac) return fractionPhrase(frac[1], frac[2]);
  return spokenInt(v);
}
