import type { GraphConfig, Lesson } from "@/types/lesson";

const BOUNDS = { xMin: -1, xMax: 7, yMin: -1, yMax: 7 } as const;

function graph(overrides: Partial<GraphConfig>): GraphConfig {
  return {
    ...BOUNDS,
    pointA: { x: 0, y: 0 },
    pointB: { x: 2, y: 4 },
    draggable: "none",
    showLine: true,
    showTriangle: true,
    showSlopeLabel: false,
    highlight: "none",
    ...overrides,
  };
}

/** Lesson 8: Match Graphs, Tables, and Equations */
export const matchRepresentationsLesson: Lesson = {
  id: "match-representations",
  order: 8,
  title: "Match Graphs, Tables, and Equations",
  description:
    "Connect the same line shown as a graph, a table, and an equation.",
  availability: "playable",
  estimatedMinutes: 7,
  objective:
    "Move between tables, graphs, and equations of the same linear relationship.",
  keyIdea: "Tables, graphs, and equations can all describe the same line.",
  concepts: ["slope-ratio"],
  solvables: [
    {
      id: "mr-1-table-slope",
      kind: "numeric",
      prompt:
        "A table shows x: 0, 1, 2 and y: 1, 3, 5. What is the slope?",
      concepts: ["slope-ratio"],
      acceptedAnswers: ["2"],
      placeholder: "slope = ?",
      wrongFeedback: [
        {
          match: "1",
          feedback: "y jumps up by 2 each time x goes up by 1, so the slope is 2.",
          misconceptionTag: "compute-error",
        },
      ],
      genericHint: "Find how much y changes for each step of x.",
      correctFeedback: "Right - y rises 2 for every 1 across, so the slope is 2.",
      explanation: "From the table, y increases by 2 each time x increases by 1: slope = 2.",
    },
    {
      id: "mr-2-table-equation",
      kind: "choice",
      prompt:
        "That same table (x: 0, 1, 2  ->  y: 1, 3, 5) matches which equation?",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "correct", label: "y = 2x + 1" },
        { id: "noint", label: "y = 2x" },
        { id: "slope1", label: "y = x + 1" },
      ],
      correctOptionId: "correct",
      wrongFeedback: {
        noint: {
          feedback: "Slope 2 is right, but at x = 0 y is 1, so add + 1.",
          misconceptionTag: "slope-vs-intercept",
        },
        slope1: {
          feedback: "The y-intercept (1) is right, but the slope is 2, not 1.",
          misconceptionTag: "slope-vs-intercept",
        },
      },
      correctFeedback: "Yes - slope 2 and y-intercept 1 give y = 2x + 1.",
      explanation: "At x = 0, y = 1 (intercept), and y rises 2 per step (slope): y = 2x + 1.",
    },
    {
      id: "mr-3-graph-equation",
      kind: "choice",
      prompt:
        "A graph crosses the y-axis at 0 and rises 3 for every 1 to the right. Its equation is...",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "correct", label: "y = 3x" },
        { id: "plus3", label: "y = x + 3" },
        { id: "third", label: "y = (1/3)x" },
      ],
      correctOptionId: "correct",
      wrongFeedback: {
        plus3: {
          feedback: "That has slope 1 and intercept 3. You want slope 3, intercept 0.",
          misconceptionTag: "slope-vs-intercept",
        },
        third: {
          feedback: "Rise 3 over run 1 is 3, not 1/3.",
          misconceptionTag: "order-swap",
        },
      },
      correctFeedback: "Right - intercept 0 and slope 3 give y = 3x.",
      explanation: "Crossing at 0 means b = 0; rising 3 per step means m = 3: y = 3x.",
    },
    {
      id: "mr-graph-match",
      kind: "graph-target",
      prompt:
        "Show that same line as a graph: it passes through (0, 0). Drag point B so its slope is 3.",
      concepts: ["slope-ratio", "constant-slope"],
      difficulty: 2,
      graph: graph({
        pointA: { x: 0, y: 0 },
        pointB: { x: 3, y: 2 },
        draggable: "B",
        showSlopeLabel: true,
        preventVertical: true,
      }),
      targetSlope: { rise: 3, run: 1 },
      feedback: {
        swapped: "Slope 3 means up 3 for every 1 across, not 1 up for 3 across.",
        negative: "Slope 3 is positive, so the line should rise to the right.",
        verticalRun0: "A vertical line has undefined slope. Move right as well as up.",
        generic: "For every 1 step right, the line should climb 3 steps.",
      },
      correctFeedback:
        "Perfect - through (0, 0) with slope 3, the graph matches y = 3x.",
      explanation:
        "The equation y = 3x, the table, and this graph are the same line: start at the origin and rise 3 for every 1 across.",
    },
    {
      id: "mr-4-evaluate",
      kind: "numeric",
      prompt: "For the line y = 5x - 2, what is y when x = 0?",
      concepts: ["slope-ratio"],
      acceptedAnswers: ["-2"],
      placeholder: "y = ?",
      wrongFeedback: [
        {
          match: "5",
          feedback: "At x = 0, the 5x part is 0. You're left with -2.",
          misconceptionTag: "slope-vs-intercept",
        },
        {
          match: "2",
          feedback: "Keep the sign: it's -2.",
          misconceptionTag: "dropped-sign",
        },
      ],
      genericHint: "Plug in x = 0: 5(0) - 2.",
      correctFeedback: "Right - at x = 0, y = -2 (that's the y-intercept).",
      explanation: "y = 5(0) - 2 = -2, which is the y-intercept b.",
    },
    {
      id: "mr-table-fill",
      kind: "table-fill",
      prompt: "Turn the equation y = 3x into a table. Fill in the missing y-values.",
      concepts: ["slope-ratio", "constant-slope"],
      difficulty: 2,
      columns: { x: "x", y: "y" },
      rows: [
        { label: "0", answer: "0" },
        { label: "1", answer: "3" },
        { label: "2", answer: "6" },
        { label: "3", answer: "9" },
      ],
      acceptDecimal: true,
      wrongFeedback: "Multiply each x by 3: that's what y = 3x means.",
      correctFeedback: "Yes - y goes up by 3 each step: 0, 3, 6, 9.",
      explanation:
        "An equation becomes a table by plugging in x-values. y = 3x gives y = 0, 3, 6, 9 for x = 0, 1, 2, 3.",
    },
    {
      id: "mr-5-steepest",
      kind: "choice",
      prompt: "Which line is the steepest?",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "five", label: "y = 5x" },
        { id: "two", label: "y = 2x" },
        { id: "one", label: "y = x" },
      ],
      correctOptionId: "five",
      wrongFeedback: {
        two: {
          feedback: "Bigger slope means steeper. 5 is bigger than 2.",
          misconceptionTag: "compute-error",
        },
        one: {
          feedback: "Slope 1 is the gentlest of these. The steepest has the biggest slope.",
          misconceptionTag: "compute-error",
        },
      },
      correctFeedback: "Yes - the bigger the slope, the steeper. Slope 5 wins.",
      explanation: "Steepness grows with slope size; y = 5x has the largest slope.",
    },
    {
      id: "mr-6-finish",
      kind: "choice",
      prompt: "Graphs, tables, and equations can all show the ___ line.",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "same", label: "same" },
        { id: "different", label: "completely different" },
        { id: "curved", label: "only a curved" },
      ],
      correctOptionId: "same",
      wrongFeedback: {
        different: {
          feedback: "They're just different views of one relationship.",
          misconceptionTag: "compute-error",
        },
        curved: {
          feedback: "We're working with straight lines here.",
          misconceptionTag: "compute-error",
        },
      },
      correctFeedback:
        "Exactly - one line, three ways to show it. Next: lines in the real world.",
      explanation:
        "A table, a graph, and an equation can all represent the same linear relationship.",
    },
  ],
};
