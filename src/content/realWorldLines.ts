import type { Lesson } from "@/types/lesson";

/** Lesson 9: Lines in the Real World */
export const realWorldLinesLesson: Lesson = {
  id: "real-world-lines",
  order: 9,
  title: "Lines in the Real World",
  description: "Use slope and intercept to model real situations.",
  availability: "playable",
  estimatedMinutes: 7,
  objective:
    "Interpret slope as a rate and the y-intercept as a starting value in context.",
  keyIdea: "In real life, slope is a rate and the y-intercept is a starting amount.",
  concepts: ["slope-ratio", "constant-rate"],
  solvables: [
    {
      id: "rw-1-phone",
      kind: "numeric",
      prompt:
        "A phone plan costs $10 plus $5 per GB. What is the cost for 3 GB?",
      concepts: ["constant-rate"],
      acceptedAnswers: ["25"],
      placeholder: "$ ?",
      wrongFeedback: [
        {
          match: "15",
          feedback: "Add the $10 base AND the per-GB cost: 10 + 5*3.",
          misconceptionTag: "slope-vs-intercept",
        },
        {
          match: "18",
          feedback: "That's 10 + 5 + 3. Multiply $5 by the 3 GB first.",
          misconceptionTag: "compute-error",
        },
      ],
      genericHint: "cost = 5 * GB + 10 = 5*3 + 10.",
      correctFeedback: "Right - 5*3 + 10 = 25.",
      explanation: "cost = 5(3) + 10 = 15 + 10 = $25. The $10 is the starting cost (intercept).",
    },
    {
      id: "rw-2-intercept-meaning",
      kind: "choice",
      prompt: "In cost = 5 * GB + 10, what does the 10 represent?",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "base", label: "the starting (base) cost before any GB" },
        { id: "pergb", label: "the cost per GB" },
        { id: "gb", label: "the number of GB" },
      ],
      correctOptionId: "base",
      wrongFeedback: {
        pergb: {
          feedback: "The cost per GB is the 5 (the slope). The 10 is the base.",
          misconceptionTag: "slope-vs-intercept",
        },
        gb: {
          feedback: "GB is the input. The 10 is the fixed starting cost.",
          misconceptionTag: "slope-vs-intercept",
        },
      },
      correctFeedback: "Yes - the 10 is the base cost, the y-intercept of the line.",
      explanation: "The constant 10 is paid no matter what, so it's the starting value (intercept).",
    },
    {
      id: "rw-3-slope-meaning",
      kind: "choice",
      prompt: "In cost = 5 * GB + 10, what does the 5 represent?",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "rate", label: "the cost per GB (the rate / slope)" },
        { id: "base", label: "the base cost" },
        { id: "total", label: "the total cost" },
      ],
      correctOptionId: "rate",
      wrongFeedback: {
        base: {
          feedback: "The base cost is the 10. The 5 is charged per GB.",
          misconceptionTag: "slope-vs-intercept",
        },
        total: {
          feedback: "The total depends on GB. The 5 is the cost for each GB.",
          misconceptionTag: "slope-vs-intercept",
        },
      },
      correctFeedback: "Right - $5 per GB is the rate, which is the slope.",
      explanation: "The 5 multiplies GB, so it's the rate of change: the slope.",
    },
    {
      id: "rw-4-candle",
      kind: "numeric",
      prompt:
        "A 20 cm candle burns down 2 cm per hour. How tall is it after 4 hours?",
      concepts: ["constant-rate"],
      acceptedAnswers: ["12"],
      placeholder: "cm",
      wrongFeedback: [
        {
          match: "8",
          feedback: "Start from 20 and subtract: 20 - 2*4.",
          misconceptionTag: "compute-error",
        },
        {
          match: "28",
          feedback: "It burns DOWN, so subtract: 20 - 2*4.",
          misconceptionTag: "dropped-sign",
        },
      ],
      genericHint: "height = 20 - 2 * hours = 20 - 2*4.",
      correctFeedback: "Right - 20 - 2*4 = 12 cm. The negative slope means it shrinks.",
      explanation: "height = 20 - 2(4) = 20 - 8 = 12 cm. Burning down is a negative slope.",
    },
    {
      id: "rw-5-savings",
      kind: "choice",
      prompt:
        "A line models your savings growing over time. The slope represents...",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "rate", label: "how fast you save per period" },
        { id: "start", label: "the money you started with" },
        { id: "total", label: "your final total" },
      ],
      correctOptionId: "rate",
      wrongFeedback: {
        start: {
          feedback: "The starting money is the y-intercept, not the slope.",
          misconceptionTag: "slope-vs-intercept",
        },
        total: {
          feedback: "The total is a point on the line; the slope is the saving rate.",
          misconceptionTag: "slope-vs-intercept",
        },
      },
      correctFeedback: "Yes - slope is the saving rate: how much you add each period.",
      explanation: "Slope is change over time, so here it's how fast savings grow.",
    },
    {
      id: "rw-6-finish",
      kind: "choice",
      prompt: "Real-world lines use slope as a ___ and the y-intercept as a ___.",
      concepts: ["slope-ratio", "constant-rate"],
      variant: "list",
      options: [
        { id: "correct", label: "rate; starting value" },
        { id: "swapped", label: "starting value; rate" },
        { id: "points", label: "point; point" },
      ],
      correctOptionId: "correct",
      wrongFeedback: {
        swapped: {
          feedback: "It's the other way: slope is the rate, intercept is the start.",
          misconceptionTag: "slope-vs-intercept",
        },
        points: {
          feedback: "Slope and intercept are a rate and a starting value, not points.",
          misconceptionTag: "slope-as-point",
        },
      },
      correctFeedback:
        "Exactly - slope is the rate of change and the y-intercept is the starting value. You've finished the chapter!",
      explanation:
        "In context, slope = rate (per unit) and the y-intercept = the starting amount.",
    },
  ],
};
