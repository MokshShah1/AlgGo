import type { NumericSolvable } from "@/types/lesson";
import type { PoolItem } from "@/features/quiz/pool";
import { mulberry32 } from "@/features/quiz/pool";

/**
 * Templated real-world slope problems with randomized numbers. No AI: each
 * template plugs random values into a fixed scenario and computes the answer,
 * giving effectively infinite y = mx + b practice grounded in real contexts.
 */

export const WORD_PROBLEM_LESSON_ID = "word-problems";

interface Template {
  id: string;
  /** Build a solvable from a seeded RNG. */
  build: (rng: () => number) => NumericSolvable;
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

const TEMPLATES: Template[] = [
  {
    id: "taxi",
    build: (rng) => {
      const base = randInt(rng, 2, 5);
      const perMile = randInt(rng, 2, 4);
      const miles = randInt(rng, 3, 9);
      const total = base + perMile * miles;
      return {
        id: "wp",
        kind: "numeric",
        prompt: `A taxi charges a $${base} flat fee plus $${perMile} per mile. What is the total cost for a ${miles}-mile ride?`,
        concepts: ["constant-rate", "slope-ratio"],
        correctFeedback: `Right! ${base} + ${perMile}x${miles} = $${total}.`,
        explanation: `The flat fee is the y-intercept ($${base}) and the per-mile rate is the slope ($${perMile}). Total = ${base} + ${perMile}*${miles} = ${total}.`,
        acceptedAnswers: [`${total}`],
        acceptDecimal: true,
        wrongFeedback: [
          { match: `${perMile * miles}`, feedback: "Don't forget to add the flat starting fee." },
        ],
        genericHint: "Total = flat fee + (rate x miles).",
        placeholder: "Total in dollars",
        difficulty: 1,
      };
    },
  },
  {
    id: "savings",
    build: (rng) => {
      const start = randInt(rng, 10, 40);
      const perWeek = randInt(rng, 5, 15);
      const weeks = randInt(rng, 4, 10);
      const total = start + perWeek * weeks;
      return {
        id: "wp",
        kind: "numeric",
        prompt: `You start with $${start} and save $${perWeek} each week. How much will you have after ${weeks} weeks?`,
        concepts: ["constant-rate", "slope-ratio"],
        correctFeedback: `Nice! $${start} + $${perWeek}x${weeks} = $${total}.`,
        explanation: `Starting amount $${start} is the y-intercept; $${perWeek}/week is the slope. After ${weeks} weeks: ${start} + ${perWeek}*${weeks} = ${total}.`,
        acceptedAnswers: [`${total}`],
        acceptDecimal: true,
        wrongFeedback: [
          { match: `${perWeek * weeks}`, feedback: "Add the amount you started with too." },
        ],
        genericHint: "Total = starting amount + (weekly savings x weeks).",
        placeholder: "Amount in dollars",
        difficulty: 1,
      };
    },
  },
  {
    id: "speed",
    build: (rng) => {
      const speed = randInt(rng, 40, 70);
      const hours = randInt(rng, 2, 6);
      const dist = speed * hours;
      return {
        id: "wp",
        kind: "numeric",
        prompt: `A car travels at a constant ${speed} miles per hour. How far does it go in ${hours} hours?`,
        concepts: ["constant-rate", "slope-ratio"],
        correctFeedback: `Correct! ${speed} x ${hours} = ${dist} miles.`,
        explanation: `Distance = rate x time. Here speed (${speed} mph) is the slope and there's no starting distance, so ${speed}*${hours} = ${dist}.`,
        acceptedAnswers: [`${dist}`],
        acceptDecimal: true,
        wrongFeedback: [
          { match: `${speed + hours}`, feedback: "Multiply the speed by the time - don't add them." },
        ],
        genericHint: "Distance = speed x time.",
        placeholder: "Distance in miles",
        difficulty: 2,
      };
    },
  },
  {
    id: "rate-from-two",
    build: (rng) => {
      const perUnit = randInt(rng, 2, 8);
      const x1 = randInt(rng, 1, 3);
      const x2 = x1 + randInt(rng, 2, 5);
      const y1 = perUnit * x1 + randInt(rng, 0, 6);
      const y2 = y1 + perUnit * (x2 - x1);
      return {
        id: "wp",
        kind: "numeric",
        prompt: `A plant is ${y1} cm tall after ${x1} weeks and ${y2} cm tall after ${x2} weeks. How many cm does it grow per week (the slope)?`,
        concepts: ["slope-ratio", "constant-rate", "rise", "run"],
        correctFeedback: `Yes! (${y2} - ${y1}) / (${x2} - ${x1}) = ${perUnit} cm/week.`,
        explanation: `Slope = rise/run = change in height / change in weeks = (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1}/${x2 - x1} = ${perUnit}.`,
        acceptedAnswers: [`${perUnit}`],
        acceptDecimal: true,
        wrongFeedback: [
          { match: `${y2 - y1}`, feedback: "That's just the rise. Divide it by the run (change in weeks)." },
        ],
        genericHint: "Slope = (change in height) / (change in weeks).",
        placeholder: "cm per week",
        difficulty: 3,
      };
    },
  },
];

/** Generate `n` word-problem pool items, optionally seeded for determinism. */
export function generateWordProblems(n: number, seed?: number): PoolItem[] {
  const rng = seed === undefined ? Math.random : mulberry32(seed);
  const items: PoolItem[] = [];
  for (let i = 0; i < n; i++) {
    const template = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
    const solvable = template.build(rng);
    items.push({
      lessonId: WORD_PROBLEM_LESSON_ID,
      solvable: { ...solvable, id: `wp-${template.id}-${i}` },
    });
  }
  return items;
}
