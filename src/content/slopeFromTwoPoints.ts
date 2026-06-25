import type { Lesson } from "@/types/lesson";
import { makeGraph } from "@/content/graphHelpers";

/** Lesson 3: Find Slope from Two Points */
export const slopeFromTwoPointsLesson: Lesson = {
  id: "slope-from-two-points",
  order: 3,
  title: "Find Slope from Two Points",
  description:
    "Use any two points to calculate slope with the rise-over-run formula.",
  availability: "playable",
  estimatedMinutes: 7,
  objective: "Compute slope between two points using (y2 - y1) / (x2 - x1).",
  keyIdea: "Slope = change in y over change in x between two points.",
  concepts: ["slope-ratio", "rise", "run"],
  solvables: [
    {
      id: "tp-1-observe",
      kind: "observe",
      prompt:
        "Drag either point. The slope is the rise over the run between the two points - no matter which points you pick on the line.",
      concepts: ["slope-ratio"],
      minInteractions: 1,
      graph: makeGraph({
        pointA: { x: 1, y: 1 },
        pointB: { x: 5, y: 3 },
        draggable: "both",
        showSlopeLabel: true,
      }),
      correctFeedback:
        "Nice. Slope compares how far the line goes up to how far it goes across between the two points.",
      explanation:
        "Pick any two points on the line. Slope = (vertical change) / (horizontal change) between them.",
    },
    {
      id: "tp-2-rise",
      kind: "numeric",
      prompt: "Find the rise from A(1, 1) to B(5, 3).",
      concepts: ["rise"],
      graph: makeGraph({
        pointA: { x: 1, y: 1 },
        pointB: { x: 5, y: 3 },
        highlight: "rise",
      }),
      acceptedAnswers: ["2"],
      placeholder: "rise = ?",
      wrongFeedback: [
        {
          match: "4",
          feedback: "That's the run (the horizontal change). Rise is up-and-down.",
          misconceptionTag: "rise-run-swap",
        },
      ],
      genericHint: "Count vertical steps from y = 1 to y = 3.",
      correctFeedback: "Right - from y = 1 up to y = 3 is a rise of 2.",
      explanation: "Rise = y2 - y1 = 3 - 1 = 2.",
    },
    {
      id: "tp-3-run",
      kind: "numeric",
      prompt: "Find the run from A(1, 1) to B(5, 3).",
      concepts: ["run"],
      graph: makeGraph({
        pointA: { x: 1, y: 1 },
        pointB: { x: 5, y: 3 },
        highlight: "run",
      }),
      acceptedAnswers: ["4"],
      placeholder: "run = ?",
      wrongFeedback: [
        {
          match: "2",
          feedback: "That's the rise. Run is the side-to-side change.",
          misconceptionTag: "rise-run-swap",
        },
      ],
      genericHint: "Count horizontal steps from x = 1 to x = 5.",
      correctFeedback: "Right - from x = 1 across to x = 5 is a run of 4.",
      explanation: "Run = x2 - x1 = 5 - 1 = 4.",
    },
    {
      id: "tp-4-slope",
      kind: "numeric",
      prompt: "So what is the slope from A(1, 1) to B(5, 3)?",
      concepts: ["slope-ratio"],
      acceptedAnswers: ["1/2"],
      acceptDecimal: true,
      placeholder: "a fraction a/b",
      wrongFeedback: [
        {
          match: "2",
          feedback: "That's run over rise, flipped. Slope is rise over run.",
          misconceptionTag: "order-swap",
        },
      ],
      genericHint: "rise 2 over run 4 = 2/4 = 1/2.",
      correctFeedback: "Perfect - 2/4 simplifies to 1/2.",
      explanation: "Slope = rise / run = 2 / 4 = 1/2.",
    },
    {
      id: "tp-5-formula",
      kind: "choice",
      prompt:
        "To find slope from two points (x1, y1) and (x2, y2), you compute:",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "correct", label: "(y2 - y1) / (x2 - x1)" },
        { id: "swapped", label: "(x2 - x1) / (y2 - y1)" },
        { id: "added", label: "(y2 + y1) / (x2 + x1)" },
      ],
      correctOptionId: "correct",
      wrongFeedback: {
        swapped: {
          feedback: "That's run over rise. Put the change in y on top.",
          misconceptionTag: "order-swap",
        },
        added: {
          feedback: "Slope uses differences (subtraction), not sums.",
          misconceptionTag: "add-not-divide",
        },
      },
      correctFeedback:
        "Yes - change in y over change in x: (y2 - y1) / (x2 - x1).",
      explanation:
        "Slope measures vertical change over horizontal change, so subtract the y's over the x's.",
    },
    {
      id: "tp-6-origin",
      kind: "numeric",
      prompt: "Find the slope between (0, 0) and (3, 6).",
      concepts: ["slope-ratio"],
      acceptedAnswers: ["2"],
      placeholder: "slope = ?",
      wrongFeedback: [
        {
          match: "1/2",
          feedback: "Flip it: rise 6 over run 3 = 2.",
          misconceptionTag: "order-swap",
        },
      ],
      genericHint: "rise = 6, run = 3, so 6/3.",
      correctFeedback: "Right - 6/3 = 2.",
      explanation: "Slope = (6 - 0) / (3 - 0) = 6 / 3 = 2.",
    },
    {
      id: "tp-7-target",
      kind: "graph-target",
      prompt: "Move point B so the slope from A is 1/2.",
      concepts: ["slope-ratio", "positive-slope"],
      graph: makeGraph({
        pointA: { x: 1, y: 1 },
        pointB: { x: 5, y: 2 },
        draggable: "B",
        showSlopeLabel: true,
        preventVertical: true,
      }),
      targetSlope: { rise: 1, run: 2 },
      feedback: {
        swapped: "Close - same numbers, but rise and run are swapped.",
        negative: "This target is positive, so the line should rise to the right.",
        verticalRun0: "A vertical line is undefined. Move right as well as up.",
        generic: "For every 2 steps right, go 1 step up.",
      },
      correctFeedback: "Perfect - up 1 for every 2 across is a slope of 1/2.",
      explanation:
        "Keep A fixed and make the triangle 1 up for every 2 across, e.g. B at (3, 2).",
    },
    {
      id: "tp-8-negative",
      kind: "choice",
      prompt: "Find the slope from (2, 5) to (4, 1).",
      concepts: ["negative-slope", "slope-ratio"],
      variant: "list",
      options: [
        { id: "neg2", label: "-2" },
        { id: "pos2", label: "2" },
        { id: "half", label: "1/2" },
        { id: "neghalf", label: "-1/2" },
      ],
      correctOptionId: "neg2",
      wrongFeedback: {
        pos2: {
          feedback: "The line falls from (2,5) to (4,1), so the slope is negative.",
          misconceptionTag: "dropped-sign",
        },
        half: {
          feedback: "That's run over rise and the wrong sign.",
          misconceptionTag: "order-swap",
        },
        neghalf: {
          feedback: "Check: rise is 1 - 5 = -4, run is 4 - 2 = 2.",
          misconceptionTag: "compute-error",
        },
      },
      correctFeedback: "Yes - rise -4 over run 2 = -2.",
      explanation: "Slope = (1 - 5) / (4 - 2) = -4 / 2 = -2.",
    },
    {
      id: "tp-9-finish",
      kind: "choice",
      prompt: "Slope between two points is...",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "rise-run", label: "the rise over the run between them" },
        { id: "run-rise", label: "the run over the rise between them" },
        { id: "sum", label: "the two points added together" },
      ],
      correctOptionId: "rise-run",
      wrongFeedback: {
        "run-rise": {
          feedback: "Order matters - rise goes on top.",
          misconceptionTag: "order-swap",
        },
        sum: {
          feedback: "Slope uses differences, not sums.",
          misconceptionTag: "add-not-divide",
        },
      },
      correctFeedback:
        "Exactly. Now you can find slope from any two points. Next: what positive, negative, zero, and undefined slopes look like.",
      explanation:
        "Slope = (y2 - y1) / (x2 - x1): the rise over the run between the two points.",
    },
  ],
};
