import type { GraphConfig, Lesson } from "@/types/lesson";

const BOUNDS = { xMin: -1, xMax: 7, yMin: -1, yMax: 7 } as const;

function graph(overrides: Partial<GraphConfig>): GraphConfig {
  return {
    ...BOUNDS,
    pointA: { x: 0, y: 2 },
    pointB: { x: 4, y: 4 },
    draggable: "none",
    showLine: true,
    showTriangle: true,
    showSlopeLabel: false,
    highlight: "none",
    ...overrides,
  };
}

/** Lesson 6: Build a Line with y = mx + b */
export const slopeInterceptFormLesson: Lesson = {
  id: "slope-intercept-form",
  order: 6,
  title: "Build a Line with y = mx + b",
  description: "Combine slope and y-intercept to write and graph any line.",
  availability: "playable",
  estimatedMinutes: 7,
  objective: "Read slope (m) and y-intercept (b) from y = mx + b and use them.",
  keyIdea: "In y = mx + b, m is the slope and b is the y-intercept.",
  concepts: ["slope-ratio"],
  solvables: [
    {
      id: "si-1-m",
      kind: "choice",
      prompt: "In y = mx + b, the letter m stands for the...",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "slope", label: "slope" },
        { id: "intercept", label: "y-intercept" },
        { id: "x", label: "x-value" },
      ],
      correctOptionId: "slope",
      wrongFeedback: {
        intercept: {
          feedback: "The y-intercept is b. m is the slope.",
          misconceptionTag: "slope-vs-intercept",
        },
        x: {
          feedback: "x is the input. m multiplies it - m is the slope.",
          misconceptionTag: "slope-vs-intercept",
        },
      },
      correctFeedback: "Yes - m is the slope, how steep the line is.",
      explanation: "In y = mx + b, m multiplies x and sets the steepness: the slope.",
    },
    {
      id: "si-2-b",
      kind: "choice",
      prompt: "In y = mx + b, the letter b stands for the...",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "intercept", label: "y-intercept" },
        { id: "slope", label: "slope" },
        { id: "x", label: "x-value" },
      ],
      correctOptionId: "intercept",
      wrongFeedback: {
        slope: {
          feedback: "The slope is m. b is the y-intercept.",
          misconceptionTag: "slope-vs-intercept",
        },
        x: {
          feedback: "x is the input. b is the constant added: the y-intercept.",
          misconceptionTag: "slope-vs-intercept",
        },
      },
      correctFeedback: "Right - b is the y-intercept, where the line starts.",
      explanation: "In y = mx + b, b is added on and sets where the line crosses the y-axis.",
    },
    {
      id: "si-slider-m",
      kind: "slider",
      prompt: "Set the slider to the slope (m) of the line y = 4x - 2.",
      concepts: ["slope-ratio"],
      difficulty: 2,
      min: -10,
      max: 10,
      step: 1,
      target: 4,
      tolerance: 0,
      wrongFeedback:
        "The slope is the number multiplied by x. In y = 4x - 2, that's the 4.",
      correctFeedback: "Yes - m = 4 is the slope, the number in front of x.",
      explanation:
        "In y = mx + b, m is the coefficient of x. For y = 4x - 2, m = 4 (the -2 is the intercept).",
    },
    {
      id: "si-3-slope",
      kind: "numeric",
      prompt: "In y = 3x + 2, what is the slope?",
      concepts: ["slope-ratio"],
      acceptedAnswers: ["3"],
      placeholder: "slope = ?",
      wrongFeedback: [
        {
          match: "2",
          feedback: "That's b, the y-intercept. The slope is the number times x.",
          misconceptionTag: "slope-vs-intercept",
        },
      ],
      genericHint: "The slope is the number multiplied by x.",
      correctFeedback: "Yes - m = 3 is the slope.",
      explanation: "In y = 3x + 2, the coefficient of x (3) is the slope.",
    },
    {
      id: "si-4-intercept",
      kind: "numeric",
      prompt: "In y = 3x + 2, what is the y-intercept?",
      concepts: ["slope-ratio"],
      acceptedAnswers: ["2"],
      placeholder: "y-intercept = ?",
      wrongFeedback: [
        {
          match: "3",
          feedback: "That's m, the slope. The y-intercept is the number added.",
          misconceptionTag: "slope-vs-intercept",
        },
      ],
      genericHint: "The y-intercept is the constant added at the end.",
      correctFeedback: "Right - b = 2 is the y-intercept.",
      explanation: "In y = 3x + 2, the constant (2) is the y-intercept.",
    },
    {
      id: "si-graph-build",
      kind: "graph-target",
      prompt:
        "This line starts at the y-intercept (0, 2). Drag point B so the line has slope 1.",
      concepts: ["slope-ratio", "constant-slope"],
      difficulty: 2,
      graph: graph({
        pointA: { x: 0, y: 2 },
        pointB: { x: 5, y: 3 },
        draggable: "B",
        showSlopeLabel: true,
        preventVertical: true,
      }),
      targetSlope: { rise: 1, run: 1 },
      feedback: {
        swapped: "Slope 1 means equal rise and run - up 1 for every 1 across.",
        negative: "Slope 1 is positive, so the line should rise as it moves right.",
        verticalRun0: "A vertical line has undefined slope. Move right as well as up.",
        generic: "For every 1 step right, the line should go up 1 step.",
      },
      correctFeedback:
        "Perfect - starting at (0, 2) with slope 1 builds the line y = x + 2.",
      explanation:
        "Plot the y-intercept (0, 2), then use the slope: up 1 for every 1 across. That gives points like (1, 3) and (2, 4): the line y = x + 2.",
    },
    {
      id: "si-5-evaluate",
      kind: "numeric",
      prompt: "For y = 2x + 1, what is y when x = 2?",
      concepts: ["slope-ratio"],
      acceptedAnswers: ["5"],
      placeholder: "y = ?",
      wrongFeedback: [
        {
          match: "4",
          feedback: "Don't forget the + 1: 2 times 2, then add 1.",
          misconceptionTag: "compute-error",
        },
        {
          match: "6",
          feedback: "That's 2 times (2 + 1). Multiply first: 2*2, then + 1.",
          misconceptionTag: "compute-error",
        },
      ],
      genericHint: "Plug in x = 2: y = 2(2) + 1.",
      correctFeedback: "Yes - 2(2) + 1 = 5.",
      explanation: "Substitute x = 2: y = 2*2 + 1 = 4 + 1 = 5.",
    },
    {
      id: "si-6-build",
      kind: "choice",
      prompt: "Which equation has slope 4 and y-intercept -1?",
      concepts: ["slope-ratio"],
      difficulty: 3,
      variant: "list",
      options: [
        { id: "correct", label: "y = 4x - 1" },
        { id: "swapped", label: "y = -x + 4" },
        { id: "wrongsign", label: "y = 4x + 1" },
      ],
      correctOptionId: "correct",
      wrongFeedback: {
        swapped: {
          feedback: "That swaps slope and intercept. Slope (m) goes in front of x.",
          misconceptionTag: "slope-vs-intercept",
        },
        wrongsign: {
          feedback: "The y-intercept should be -1, not +1.",
          misconceptionTag: "dropped-sign",
        },
      },
      correctFeedback: "Yes - m = 4 in front of x, b = -1 added on: y = 4x - 1.",
      explanation: "Slope 4 makes the coefficient of x; intercept -1 is the constant.",
    },
    {
      id: "si-7-finish",
      kind: "choice",
      prompt: "y = mx + b builds a line from its...",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "both", label: "slope and y-intercept" },
        { id: "points", label: "two random points" },
        { id: "xonly", label: "x-values only" },
      ],
      correctOptionId: "both",
      wrongFeedback: {
        points: {
          feedback: "You can use points, but the form y = mx + b uses slope and intercept.",
          misconceptionTag: "slope-vs-intercept",
        },
        xonly: {
          feedback: "You need both m and b, not just x.",
          misconceptionTag: "slope-vs-intercept",
        },
      },
      correctFeedback:
        "Exactly - slope (m) and y-intercept (b) define the whole line. Next: lines that start at zero.",
      explanation: "y = mx + b uses the slope m and the y-intercept b to describe a line.",
    },
  ],
};
