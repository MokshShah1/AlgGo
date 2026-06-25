import type { Lesson } from "@/types/lesson";
import { makeGraph } from "@/content/graphHelpers";

/** Lesson 7: When Lines Start at Zero (Proportional Relationships) */
export const proportionalRelationshipsLesson: Lesson = {
  id: "proportional-relationships",
  order: 7,
  title: "When Lines Start at Zero",
  description: "Explore proportional lines that pass through the origin.",
  availability: "playable",
  estimatedMinutes: 6,
  objective:
    "Identify proportional relationships as lines through the origin with a constant rate.",
  keyIdea: "A proportional line passes through (0, 0) and has the form y = mx.",
  concepts: ["constant-rate", "slope-ratio"],
  solvables: [
    {
      id: "pr-1-origin",
      kind: "choice",
      prompt: "A proportional relationship always passes through which point?",
      concepts: ["constant-rate"],
      variant: "list",
      options: [
        { id: "origin", label: "(0, 0), the origin" },
        { id: "one", label: "(1, 1)" },
        { id: "any", label: "any point you choose" },
      ],
      correctOptionId: "origin",
      wrongFeedback: {
        one: {
          feedback: "It might pass through (1,1), but it must pass through (0,0).",
          misconceptionTag: "starts-at-origin",
        },
        any: {
          feedback: "Proportional lines specifically pass through the origin.",
          misconceptionTag: "starts-at-origin",
        },
      },
      correctFeedback: "Yes - proportional relationships start at the origin (0, 0).",
      explanation: "If y is proportional to x, then y = 0 when x = 0, so it passes through (0, 0).",
    },
    {
      id: "pr-2-evaluate",
      kind: "numeric",
      prompt: "For y = 4x, what is y when x = 3?",
      concepts: ["slope-ratio"],
      acceptedAnswers: ["12"],
      placeholder: "y = ?",
      wrongFeedback: [
        {
          match: "7",
          feedback: "That adds 4 + 3. Here y = 4 times x, so multiply.",
          misconceptionTag: "add-not-divide",
        },
      ],
      genericHint: "y = 4 times 3.",
      correctFeedback: "Right - 4 times 3 = 12.",
      explanation: "y = 4x means multiply x by 4: 4 * 3 = 12.",
    },
    {
      id: "pr-3-is-proportional",
      kind: "choice",
      prompt: "Is y = 2x + 3 a proportional relationship?",
      concepts: ["constant-rate"],
      variant: "list",
      options: [
        { id: "no", label: "No - it doesn't start at 0" },
        { id: "yes", label: "Yes" },
      ],
      correctOptionId: "no",
      wrongFeedback: {
        yes: {
          feedback: "It has a + 3 start, so it crosses the y-axis at 3, not 0. Not proportional.",
          misconceptionTag: "starts-at-origin",
        },
      },
      correctFeedback: "Correct - the + 3 means it starts at 3, so it isn't proportional.",
      explanation:
        "Proportional means y = mx with no constant added. The + 3 makes it start at 3, not the origin.",
    },
    {
      id: "pr-4-unit-rate",
      kind: "numeric",
      prompt: "If 2 pens cost $6, what is the cost of 1 pen (the unit rate)?",
      concepts: ["slope-ratio"],
      acceptedAnswers: ["3"],
      placeholder: "$ per pen",
      wrongFeedback: [
        {
          match: "6",
          feedback: "That's the cost of 2 pens. Divide by 2 for one pen.",
          misconceptionTag: "compute-error",
        },
        {
          match: "12",
          feedback: "Divide, don't multiply: $6 for 2 pens means $3 each.",
          misconceptionTag: "add-not-divide",
        },
      ],
      genericHint: "Divide total cost by number of pens: 6 / 2.",
      correctFeedback: "Right - $6 / 2 pens = $3 per pen. That unit rate is the slope.",
      explanation: "Unit rate = cost per pen = 6 / 2 = $3. In y = mx, that's m.",
    },
    {
      id: "pr-5-observe",
      kind: "observe",
      prompt:
        "Drag point B. Point A is locked at the origin - a proportional line always passes through (0, 0).",
      concepts: ["constant-rate", "slope-ratio"],
      minInteractions: 1,
      graph: makeGraph({
        pointA: { x: 0, y: 0 },
        pointB: { x: 2, y: 4 },
        draggable: "B",
        showSlopeLabel: true,
        preventVertical: true,
      }),
      correctFeedback:
        "See how the line always goes through the origin? That's what makes it proportional.",
      explanation:
        "A proportional line y = mx pivots around the origin. Its slope m is the constant unit rate.",
    },
    {
      id: "pr-6-finish",
      kind: "choice",
      prompt: "A proportional relationship is a line through the ___ with a constant rate.",
      concepts: ["constant-rate"],
      variant: "list",
      options: [
        { id: "origin", label: "origin" },
        { id: "top", label: "top of the graph" },
        { id: "yintercept", label: "y-intercept at 5" },
      ],
      correctOptionId: "origin",
      wrongFeedback: {
        top: {
          feedback: "It's specifically the origin (0, 0), not the top.",
          misconceptionTag: "starts-at-origin",
        },
        yintercept: {
          feedback: "A nonzero y-intercept means it's not proportional.",
          misconceptionTag: "starts-at-origin",
        },
      },
      correctFeedback:
        "Exactly - through the origin with constant rate: y = mx. Next: matching graphs, tables, and equations.",
      explanation: "Proportional = straight line through the origin, written y = mx.",
    },
  ],
};
