import type { Lesson } from "@/types/lesson";
import { makeGraph } from "@/content/graphHelpers";

/** Lesson 4: Positive, Negative, Zero, and Undefined Slope */
export const positiveNegativeSlopeLesson: Lesson = {
  id: "positive-negative-slope",
  order: 4,
  title: "Positive, Negative, Zero, and Undefined Slope",
  description:
    "Read a line's direction and steepness from the sign and size of its slope.",
  availability: "playable",
  estimatedMinutes: 6,
  objective:
    "Classify slopes as positive, negative, zero, or undefined from a line's direction.",
  keyIdea: "Up-right is positive, down-right is negative, flat is 0, vertical is undefined.",
  concepts: ["positive-slope", "negative-slope"],
  solvables: [
    {
      id: "pn-1-observe",
      kind: "observe",
      prompt:
        "Drag point B above and below point A. Watch the sign of the slope change as the line tilts up or down.",
      concepts: ["positive-slope", "negative-slope"],
      minInteractions: 1,
      graph: makeGraph({
        pointA: { x: 3, y: 3 },
        pointB: { x: 5, y: 5 },
        draggable: "B",
        showSlopeLabel: true,
        preventVertical: true,
      }),
      correctFeedback:
        "See it? Tilting up to the right gives a positive slope; tilting down gives a negative slope.",
      explanation:
        "When the line rises to the right, slope is positive. When it falls to the right, slope is negative.",
    },
    {
      id: "pn-2-positive",
      kind: "choice",
      prompt: "A line that goes UP as you move to the right has a slope that is...",
      concepts: ["positive-slope"],
      variant: "list",
      options: [
        { id: "pos", label: "positive" },
        { id: "neg", label: "negative" },
        { id: "zero", label: "zero" },
      ],
      correctOptionId: "pos",
      wrongFeedback: {
        neg: {
          feedback: "Negative slopes go down to the right, not up.",
          misconceptionTag: "dropped-sign",
        },
        zero: {
          feedback: "Zero slope is flat. This line is climbing.",
          misconceptionTag: "compute-error",
        },
      },
      correctFeedback: "Yes - rising to the right means a positive slope.",
      explanation: "Going up as x increases means rise is positive, so slope is positive.",
    },
    {
      id: "pn-3-negative",
      kind: "choice",
      prompt: "A line that goes DOWN as you move to the right has a slope that is...",
      concepts: ["negative-slope"],
      variant: "list",
      options: [
        { id: "neg", label: "negative" },
        { id: "pos", label: "positive" },
        { id: "zero", label: "zero" },
      ],
      correctOptionId: "neg",
      wrongFeedback: {
        pos: {
          feedback: "Positive slopes climb to the right. This one falls.",
          misconceptionTag: "dropped-sign",
        },
        zero: {
          feedback: "Zero slope is flat. This line is dropping.",
          misconceptionTag: "compute-error",
        },
      },
      correctFeedback: "Right - falling to the right means a negative slope.",
      explanation: "Going down as x increases means rise is negative, so slope is negative.",
    },
    {
      id: "pn-4-zero",
      kind: "numeric",
      prompt: "A flat, horizontal line has what slope?",
      concepts: ["slope-ratio"],
      acceptedAnswers: ["0"],
      placeholder: "slope = ?",
      wrongFeedback: [
        {
          match: "1",
          feedback: "No up-or-down change means a rise of 0, so the slope is 0.",
          misconceptionTag: "compute-error",
        },
      ],
      genericHint: "Rise is 0, and 0 divided by any run is 0.",
      correctFeedback: "Correct - a horizontal line has slope 0.",
      explanation: "Horizontal means rise = 0, so slope = 0 / run = 0.",
    },
    {
      id: "pn-5-undefined",
      kind: "choice",
      prompt: "A straight up-and-down vertical line has a slope that is...",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "undef", label: "undefined" },
        { id: "zero", label: "zero" },
        { id: "big", label: "a very large positive number" },
      ],
      correctOptionId: "undef",
      wrongFeedback: {
        zero: {
          feedback: "Zero is horizontal. Vertical has run 0, so it's undefined.",
          misconceptionTag: "zero-vs-undefined",
        },
        big: {
          feedback: "Dividing by a run of 0 isn't a number - it's undefined.",
          misconceptionTag: "zero-vs-undefined",
        },
      },
      correctFeedback: "Yes - a vertical line has run 0, so its slope is undefined.",
      explanation:
        "Vertical means run = 0. Dividing rise by 0 is undefined, so vertical lines have no slope value.",
    },
    {
      id: "pn-6-classify",
      kind: "choice",
      prompt: "Which description has a NEGATIVE slope?",
      concepts: ["negative-slope"],
      variant: "list",
      options: [
        { id: "down", label: "A line falling from upper-left to lower-right" },
        { id: "up", label: "A line rising from lower-left to upper-right" },
        { id: "flat", label: "A perfectly flat line" },
      ],
      correctOptionId: "down",
      wrongFeedback: {
        up: {
          feedback: "Rising to the right is positive slope.",
          misconceptionTag: "dropped-sign",
        },
        flat: {
          feedback: "A flat line has slope 0, not negative.",
          misconceptionTag: "compute-error",
        },
      },
      correctFeedback: "Exactly - falling to the right is a negative slope.",
      explanation: "Negative slope = the line goes down as you read left to right.",
    },
    {
      id: "pn-7-finish",
      kind: "choice",
      prompt: "Zero slope is ___ and undefined slope is ___.",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "hv", label: "horizontal; vertical" },
        { id: "vh", label: "vertical; horizontal" },
        { id: "pn", label: "positive; negative" },
      ],
      correctOptionId: "hv",
      wrongFeedback: {
        vh: {
          feedback: "It's the other way: flat (horizontal) is 0, vertical is undefined.",
          misconceptionTag: "zero-vs-undefined",
        },
        pn: {
          feedback: "Those describe direction, not zero/undefined.",
          misconceptionTag: "compute-error",
        },
      },
      correctFeedback:
        "Right - flat lines have slope 0, vertical lines are undefined. Next: the y-intercept.",
      explanation:
        "Horizontal lines have rise 0 (slope 0). Vertical lines have run 0 (undefined slope).",
    },
  ],
};
