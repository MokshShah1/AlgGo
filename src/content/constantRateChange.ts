import type { Lesson } from "@/types/lesson";
import { makeGraph } from "@/content/graphHelpers";

/** Lesson 1: What Changes at a Constant Rate? */
export const constantRateChangeLesson: Lesson = {
  id: "constant-rate-change",
  order: 1,
  title: "What Changes at a Constant Rate?",
  description:
    "Spot patterns that grow by the same amount each step - the idea behind a straight line.",
  availability: "playable",
  estimatedMinutes: 5,
  objective:
    "Recognize a constant rate of change and connect it to a straight-line graph.",
  keyIdea: "A constant rate adds the same amount every step.",
  concepts: ["constant-rate"],
  solvables: [
    {
      id: "cr-1-observe",
      kind: "observe",
      prompt:
        "Drag point B. Notice the line stays straight - each step to the right adds the same amount going up. That steady amount is a constant rate.",
      concepts: ["constant-rate"],
      minInteractions: 1,
      graph: makeGraph({
        pointA: { x: 0, y: 1 },
        pointB: { x: 3, y: 4 },
        draggable: "B",
        showSlopeLabel: true,
      }),
      correctFeedback:
        "Right - a straight line means the change is steady: the same rise for every step to the right.",
      explanation:
        "On a straight line the line climbs by the same amount for each step right. That unchanging amount is the constant rate of change.",
    },
    {
      id: "cr-2-taxi",
      kind: "numeric",
      prompt: "A taxi charges $3 for every mile. How much does 4 miles cost?",
      concepts: ["constant-rate"],
      acceptedAnswers: ["12"],
      placeholder: "$ ?",
      wrongFeedback: [
        {
          match: "7",
          feedback: "That adds 3 + 4. Each mile costs $3, so multiply by the miles.",
          misconceptionTag: "add-not-divide",
        },
        {
          match: "3",
          feedback: "That's the cost of just one mile. You need 4 miles.",
          misconceptionTag: "compute-error",
        },
      ],
      genericHint: "4 miles x $3 per mile.",
      correctFeedback: "$12 - each mile adds the same $3. That's a constant rate.",
      explanation: "A constant rate of $3 per mile means 4 x $3 = $12.",
    },
    {
      id: "cr-3-which-situation",
      kind: "choice",
      prompt: "Which situation has a constant rate of change?",
      concepts: ["constant-rate"],
      variant: "list",
      options: [
        { id: "car", label: "A car drives 60 miles every hour." },
        { id: "ball", label: "A ball speeds up as it falls." },
        { id: "temp", label: "The daily temperature jumps around randomly." },
      ],
      correctOptionId: "car",
      wrongFeedback: {
        ball: {
          feedback: "Speeding up means the rate keeps changing - not constant.",
          misconceptionTag: "constant-rate",
        },
        temp: {
          feedback: "Random values have no steady rate at all.",
          misconceptionTag: "constant-rate",
        },
      },
      correctFeedback: "Yes - the same 60 miles every hour is a constant rate.",
      explanation:
        "Constant rate means the same change each step. 60 miles per hour, every hour, fits that exactly.",
    },
    {
      id: "cr-4-table",
      kind: "choice",
      prompt: "Which table shows a constant rate of change?",
      concepts: ["constant-rate"],
      variant: "list",
      options: [
        { id: "steady", label: "x: 1, 2, 3  ->  y: 2, 4, 6  (adds 2 each time)" },
        { id: "growing", label: "x: 1, 2, 3  ->  y: 1, 4, 9  (adds 3, then 5)" },
        { id: "jumpy", label: "x: 1, 2, 3  ->  y: 2, 5, 11  (adds 3, then 6)" },
      ],
      correctOptionId: "steady",
      wrongFeedback: {
        growing: {
          feedback: "The jumps change size (3, then 5), so the rate isn't constant.",
          misconceptionTag: "constant-rate",
        },
        jumpy: {
          feedback: "The differences grow (3, then 6) - that's not a steady rate.",
          misconceptionTag: "constant-rate",
        },
      },
      correctFeedback: "Exactly - y goes up by the same 2 every time. Constant rate.",
      explanation:
        "A constant rate adds the same amount each step. Only the first table adds 2 every time.",
    },
    {
      id: "cr-5-tank",
      kind: "numeric",
      prompt:
        "A tank fills 5 liters each minute, starting empty. How many liters after 3 minutes?",
      concepts: ["constant-rate"],
      acceptedAnswers: ["15"],
      placeholder: "liters",
      wrongFeedback: [
        {
          match: "8",
          feedback: "That adds 5 + 3. Each minute adds 5 liters, so multiply.",
          misconceptionTag: "add-not-divide",
        },
        {
          match: "5",
          feedback: "That's after just 1 minute. You need 3 minutes.",
          misconceptionTag: "compute-error",
        },
      ],
      genericHint: "5 liters per minute x 3 minutes.",
      correctFeedback: "15 liters - a steady 5 every minute.",
      explanation: "Constant rate of 5 L/min for 3 minutes: 5 x 3 = 15.",
    },
    {
      id: "cr-6-finish",
      kind: "choice",
      prompt: "A constant rate of change always graphs as...",
      concepts: ["constant-rate"],
      variant: "list",
      options: [
        { id: "line", label: "a straight line" },
        { id: "curve", label: "a curve" },
        { id: "dots", label: "scattered dots" },
      ],
      correctOptionId: "line",
      wrongFeedback: {
        curve: {
          feedback: "A curve means the rate is changing. Constant rate stays straight.",
          misconceptionTag: "constant-rate",
        },
        dots: {
          feedback: "Scattered dots have no steady pattern.",
          misconceptionTag: "constant-rate",
        },
      },
      correctFeedback:
        "Exactly - a constant rate makes a straight line. Next, you'll measure how steep that line is: its slope.",
      explanation:
        "Because the change is the same every step, the points line up perfectly straight.",
    },
  ],
};
