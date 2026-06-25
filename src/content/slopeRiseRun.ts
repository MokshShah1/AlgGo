import type { GraphConfig, Lesson } from "@/types/lesson";

/**
 * Lesson 2: "Slope = Rise / Run" - the playable MVP flagship lesson.
 * All prompts, accepted answers, and hand-written feedback are authored from
 * PRD sections 10-12. Total XP target ~75 (10 solvables x 5 + 25 completion).
 */

const BOUNDS = { xMin: -1, xMax: 7, yMin: -1, yMax: 7 } as const;

function graph(overrides: Partial<GraphConfig>): GraphConfig {
  return {
    ...BOUNDS,
    pointA: { x: 1, y: 1 },
    pointB: { x: 4, y: 3 },
    draggable: "none",
    showLine: true,
    showTriangle: true,
    showSlopeLabel: false,
    highlight: "none",
    ...overrides,
  };
}

export const slopeRiseRunLesson: Lesson = {
  id: "slope-rise-run",
  order: 2,
  title: "Slope = Rise / Run",
  description:
    "Discover slope as the vertical change compared to the horizontal change between two points.",
  availability: "playable",
  estimatedMinutes: 7,
  objective:
    "Understand slope as the ratio of vertical change to horizontal change between two points on a line.",
  keyIdea: "Slope tells how much a line rises or falls for each step to the right.",
  concepts: ["rise", "run", "slope-ratio", "negative-slope", "constant-slope"],
  solvables: [
    // Solvable 1: Intuition First (observe)
    {
      id: "s1-intuition",
      kind: "observe",
      prompt:
        "Drag the blue point. Watch the line. What changes when the point moves higher?",
      concepts: ["rise", "constant-rate"],
      minInteractions: 1,
      graph: graph({
        draggable: "B",
        showSlopeLabel: true,
      }),
      correctFeedback:
        "Nice. When the point moves higher, the vertical change gets bigger. That vertical change is called the rise.",
      explanation:
        "As point B moves up, the triangle's vertical leg grows. That vertical leg is the rise - how far the line climbs between the two points.",
    },

    // Solvable 2: Identify Rise (numeric)
    {
      id: "s2-identify-rise",
      kind: "numeric",
      prompt:
        "The line goes from point A (1, 1) to point B (4, 3). What is the rise?",
      concepts: ["rise"],
      graph: graph({ highlight: "rise" }),
      acceptedAnswers: ["2"],
      placeholder: "Rise = ?",
      wrongFeedback: [
        {
          match: "3",
          feedback:
            "That's the run, the horizontal change. Rise is the up-and-down change.",
          misconceptionTag: "rise-run-swap",
        },
        {
          match: "-2",
          feedback: "The line goes upward from A to B, so the rise is positive.",
          misconceptionTag: "dropped-sign",
        },
      ],
      genericHint: "Count the vertical steps from y = 1 to y = 3.",
      correctFeedback: "Exactly. From y = 1 up to y = 3 is a rise of 2.",
      explanation:
        "Rise is the change in y. Start at y = 1 (point A) and count up to y = 3 (point B): that's 2 steps up, so rise = 2.",
    },

    // Solvable 3: Identify Run (numeric)
    {
      id: "s3-identify-run",
      kind: "numeric",
      prompt: "Now find the run from (1, 1) to (4, 3).",
      concepts: ["run"],
      graph: graph({ highlight: "run" }),
      acceptedAnswers: ["3"],
      placeholder: "Run = ?",
      wrongFeedback: [
        {
          match: "2",
          feedback: "That's the rise. Run is the side-to-side change.",
          misconceptionTag: "rise-run-swap",
        },
      ],
      genericHint: "Count the horizontal steps from x = 1 to x = 4.",
      correctFeedback: "Right. From x = 1 across to x = 4 is a run of 3.",
      explanation:
        "Run is the change in x. Start at x = 1 (point A) and count across to x = 4 (point B): that's 3 steps right, so run = 3.",
    },

    // Solvable 4: Build the Formula (choice / tiles)
    {
      id: "s4-build-formula",
      kind: "choice",
      prompt: "Slope compares rise to run. Build the slope fraction.",
      concepts: ["slope-ratio"],
      variant: "tiles",
      options: [
        { id: "rise-over-run", label: "rise / run" },
        { id: "run-over-rise", label: "run / rise" },
        { id: "rise-plus-run", label: "rise + run" },
      ],
      correctOptionId: "rise-over-run",
      wrongFeedback: {
        "run-over-rise": {
          feedback:
            "You found the right two pieces, but the order matters. Slope is vertical change over horizontal change.",
          misconceptionTag: "order-swap",
        },
        "rise-plus-run": {
          feedback:
            "Slope is a ratio, not a total. We compare rise to run using division.",
          misconceptionTag: "add-not-divide",
        },
      },
      correctFeedback:
        "Yes. Slope = rise / run: vertical change over horizontal change.",
      explanation:
        "Slope is a ratio. We put the rise (vertical change) on top and the run (horizontal change) on the bottom: slope = rise / run.",
    },

    // Solvable 5: Compute Slope (numeric / fraction)
    {
      id: "s5-compute-slope",
      kind: "numeric",
      prompt: "If rise is 2 and run is 3, what is the slope?",
      concepts: ["slope-ratio"],
      acceptedAnswers: ["2/3"],
      acceptDecimal: true,
      placeholder: "a fraction a/b",
      wrongFeedback: [
        {
          match: "3/2",
          feedback:
            "That is run divided by rise. Flip it: slope is rise divided by run.",
          misconceptionTag: "order-swap",
        },
        {
          match: "5",
          feedback: "That adds rise and run. Slope is a ratio.",
          misconceptionTag: "add-not-divide",
        },
        {
          match: "1",
          feedback: "Check the fraction: rise is 2 and run is 3.",
          misconceptionTag: "compute-error",
        },
      ],
      genericHint: "Slope = rise / run = 2 / 3.",
      correctFeedback: "Perfect. Slope = rise / run = 2/3.",
      explanation:
        "Divide rise by run: 2 / 3. As a decimal that's about 0.67, but the fraction 2/3 keeps the meaning clear.",
    },

    // Solvable 6: Drag to Match a Target Slope (graph-target)
    {
      id: "s6-match-target",
      kind: "graph-target",
      prompt: "Move point B so the line has slope 2/3.",
      concepts: ["slope-ratio", "positive-slope", "constant-slope"],
      graph: graph({
        pointA: { x: 1, y: 1 },
        pointB: { x: 5, y: 2 },
        draggable: "B",
        showSlopeLabel: true,
        preventVertical: true,
      }),
      targetSlope: { rise: 2, run: 3 },
      feedback: {
        swapped:
          "Close: you used the same numbers, but rise and run are swapped.",
        negative:
          "This target slope is positive, so the line should rise as it moves right.",
        verticalRun0:
          "A vertical line has undefined slope. Try moving right as well as up.",
        generic: "For every 3 steps right, the line should go 2 steps up.",
      },
      correctFeedback: "Perfect. Slope 2/3 means up 2 for every 3 across.",
      explanation:
        "Keep point A fixed and move B so the triangle is 2 up for every 3 across - for example B at (4, 3). Equivalent triangles like 4 up / 6 across also give 2/3.",
    },

    // Solvable 7: Same Slope, Different Triangle (choice / discovery)
    {
      id: "s7-same-slope",
      kind: "choice",
      prompt:
        "Bigger and smaller slope triangles are drawn on the same line. Does the slope change?",
      concepts: ["constant-slope"],
      variant: "list",
      graph: graph({
        pointA: { x: 0, y: 0 },
        pointB: { x: 6, y: 4 },
        showSlopeLabel: true,
      }),
      options: [
        { id: "yes-bigger", label: "Yes, a bigger triangle means a bigger slope." },
        { id: "no-same", label: "No, the slope stays the same." },
        { id: "only-moves", label: "Only if the line moves." },
      ],
      correctOptionId: "no-same",
      wrongFeedback: {
        "yes-bigger": {
          feedback:
            "Bigger triangles look different, but the ratio rise/run stays equal. They are scaled copies.",
          misconceptionTag: "triangle-size",
        },
        "only-moves": {
          feedback:
            "The triangle can slide along the same line and the slope still stays the same.",
          misconceptionTag: "triangle-size",
        },
      },
      correctFeedback:
        "Exactly. On a straight line, any slope triangle gives the same ratio. Bigger triangles are just scaled copies.",
      explanation:
        "Pick any two points on a straight line and the rise/run ratio is always the same. Larger triangles are scaled-up versions of smaller ones - same slope.",
    },

    // Solvable 8: Misconception Check (choice, multi-try)
    {
      id: "s8-misconception",
      kind: "choice",
      prompt: "A line has rise -2 and run 4. What is its slope?",
      concepts: ["negative-slope", "slope-ratio"],
      variant: "list",
      options: [
        { id: "neg2-over-4", label: "-2/4" },
        { id: "4-over-neg2", label: "4/-2" },
        { id: "2-over-4", label: "2/4" },
        { id: "six", label: "6" },
      ],
      correctOptionId: "neg2-over-4",
      wrongFeedback: {
        "4-over-neg2": {
          feedback:
            "That gives the same value here, but it hides the meaning. Rise belongs on top and run belongs on bottom.",
          misconceptionTag: "order-swap",
        },
        "2-over-4": {
          feedback:
            "The sign matters. The line falls as it moves right, so the slope is negative.",
          misconceptionTag: "dropped-sign",
        },
        six: {
          feedback: "Slope compares change using division, not addition.",
          misconceptionTag: "add-not-divide",
        },
      },
      correctFeedback:
        "Yes. Rise -2 over run 4 is -2/4, which simplifies to -1/2.",
      explanation:
        "Put rise on top and run on the bottom: -2/4. A negative rise with a positive run means the line falls as it goes right, so the slope is negative: -1/2.",
    },

    // Solvable 9: Explain in Words (short choice)
    {
      id: "s9-explain-words",
      kind: "choice",
      prompt: "What does a slope of 2/3 mean?",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        {
          id: "rate",
          label: "For every 3 steps right, the line goes 2 steps up.",
        },
        { id: "starts-at-2", label: "The line starts at 2." },
        { id: "crosses-3", label: "The line crosses the y-axis at 3." },
        { id: "point", label: "The point is located at (2, 3)." },
      ],
      correctOptionId: "rate",
      wrongFeedback: {
        "starts-at-2": {
          feedback:
            "That describes a starting value (the y-intercept), not the slope.",
          misconceptionTag: "slope-vs-intercept",
        },
        "crosses-3": {
          feedback: "That's about the y-intercept, not the slope.",
          misconceptionTag: "slope-vs-intercept",
        },
        point: {
          feedback:
            "That's a single point. Slope is a rate of change between points.",
          misconceptionTag: "slope-as-point",
        },
      },
      correctFeedback: "Right. Slope is a rate: up 2 for every 3 to the right.",
      explanation:
        "Slope is a rate, not a point or a starting value. 2/3 means the line climbs 2 units for every 3 units it moves to the right.",
    },

    // Solvable 10: Lesson Finish (reflection / completion)
    {
      id: "s10-finish",
      kind: "choice",
      prompt: "Complete the sentence: Slope is...",
      concepts: ["slope-ratio"],
      variant: "list",
      options: [
        { id: "rise-over-run", label: "rise divided by run" },
        { id: "run-over-rise", label: "run divided by rise" },
        { id: "rise-plus-run", label: "rise plus run" },
        { id: "a-point", label: "a single point on the line" },
      ],
      correctOptionId: "rise-over-run",
      wrongFeedback: {
        "run-over-rise": {
          feedback:
            "The pieces are right, but the order matters: rise goes on top.",
          misconceptionTag: "order-swap",
        },
        "rise-plus-run": {
          feedback: "Slope is a ratio, not a total - we divide, not add.",
          misconceptionTag: "add-not-divide",
        },
        "a-point": {
          feedback: "Slope is a rate of change, not a single point.",
          misconceptionTag: "slope-as-point",
        },
      },
      correctFeedback:
        "You learned the core idea: slope is vertical change compared to horizontal change. Next, you'll use two points to find slope anywhere.",
      explanation:
        "Slope = rise / run. It measures how much a line rises (or falls) for each step to the right.",
    },
  ],
};
