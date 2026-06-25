import type { Lesson } from "@/types/lesson";
import { makeGraph } from "@/content/graphHelpers";

/** Lesson 5: The Starting Value: y-Intercept */
export const yInterceptLesson: Lesson = {
  id: "y-intercept",
  order: 5,
  title: "The Starting Value: y-Intercept",
  description: "Find where a line crosses the y-axis and what that means.",
  availability: "playable",
  estimatedMinutes: 5,
  objective: "Identify the y-intercept of a line from a graph and an equation.",
  keyIdea: "The y-intercept is the y-value where the line crosses the y-axis (x = 0).",
  concepts: ["slope-ratio"],
  solvables: [
    {
      id: "yi-1-observe",
      kind: "observe",
      prompt:
        "Drag point B. Point A sits where the line crosses the y-axis - that crossing point is called the y-intercept.",
      concepts: ["slope-ratio"],
      minInteractions: 1,
      graph: makeGraph({
        pointA: { x: 0, y: 2 },
        pointB: { x: 3, y: 4 },
        draggable: "B",
        showTriangle: false,
      }),
      correctFeedback:
        "Notice point A stays on the y-axis. Where the line meets the y-axis is the y-intercept.",
      explanation:
        "The y-intercept is where the line crosses the vertical y-axis - the y-value when x = 0.",
    },
    {
      id: "yi-2-read",
      kind: "numeric",
      prompt: "Look at the line. At what y-value does it cross the y-axis?",
      concepts: ["slope-ratio"],
      graph: makeGraph({
        pointA: { x: 0, y: 2 },
        pointB: { x: 3, y: 4 },
        showTriangle: false,
      }),
      acceptedAnswers: ["2"],
      placeholder: "y = ?",
      wrongFeedback: [
        {
          match: "0",
          feedback: "The line crosses above the origin here, not at 0.",
          misconceptionTag: "starts-at-origin",
        },
        {
          match: "3",
          feedback: "That's an x-value. Read the y-value where x = 0.",
          misconceptionTag: "slope-vs-intercept",
        },
      ],
      genericHint: "Find the y-value of the point sitting on the y-axis (x = 0).",
      correctFeedback: "Right - the line crosses the y-axis at y = 2.",
      explanation: "Point A is at (0, 2), so the y-intercept is 2.",
    },
    {
      id: "yi-3-when",
      kind: "choice",
      prompt: "The y-intercept is the value of y when x equals...",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "zero", label: "0" },
        { id: "one", label: "1" },
        { id: "y", label: "the same as y" },
      ],
      correctOptionId: "zero",
      wrongFeedback: {
        one: {
          feedback: "Close, but the y-axis is at x = 0, not x = 1.",
          misconceptionTag: "slope-vs-intercept",
        },
        y: {
          feedback: "The y-intercept happens at a specific x: x = 0.",
          misconceptionTag: "slope-vs-intercept",
        },
      },
      correctFeedback: "Yes - the y-intercept is the y-value when x = 0.",
      explanation: "The y-axis is the line x = 0, so the y-intercept is y at x = 0.",
    },
    {
      id: "yi-4-equation",
      kind: "numeric",
      prompt: "In y = 2x + 5, what is the y-intercept?",
      concepts: ["slope-ratio"],
      acceptedAnswers: ["5"],
      placeholder: "y-intercept = ?",
      wrongFeedback: [
        {
          match: "2",
          feedback: "That's the slope (the number multiplied by x). The intercept is added on.",
          misconceptionTag: "slope-vs-intercept",
        },
      ],
      genericHint: "The y-intercept is the constant added at the end.",
      correctFeedback: "Right - the +5 is the y-intercept.",
      explanation: "In y = mx + b, b is the y-intercept. Here b = 5.",
    },
    {
      id: "yi-5-misconception",
      kind: "choice",
      prompt: "In y = 4x + 3, which number is the y-intercept?",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "three", label: "3" },
        { id: "four", label: "4" },
        { id: "point", label: "(4, 3)" },
      ],
      correctOptionId: "three",
      wrongFeedback: {
        four: {
          feedback: "4 is the slope. The y-intercept is the number added: 3.",
          misconceptionTag: "slope-vs-intercept",
        },
        point: {
          feedback: "The y-intercept is a single y-value, not a coordinate pair.",
          misconceptionTag: "slope-as-point",
        },
      },
      correctFeedback: "Yes - b = 3 is the y-intercept.",
      explanation: "y = mx + b: m = 4 is the slope, b = 3 is the y-intercept.",
    },
    {
      id: "yi-6-finish",
      kind: "choice",
      prompt: "The y-intercept tells you where a line...",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "cross", label: "crosses the y-axis" },
        { id: "steep", label: "is steepest" },
        { id: "ends", label: "ends" },
      ],
      correctOptionId: "cross",
      wrongFeedback: {
        steep: {
          feedback: "Steepness is the slope, not the intercept.",
          misconceptionTag: "slope-vs-intercept",
        },
        ends: {
          feedback: "Lines don't end; the intercept is where it crosses the y-axis.",
          misconceptionTag: "slope-vs-intercept",
        },
      },
      correctFeedback:
        "Exactly - the y-intercept is where the line crosses the y-axis. Next: put slope and intercept together as y = mx + b.",
      explanation:
        "The y-intercept is the starting value where the line meets the y-axis at x = 0.",
    },
  ],
};
