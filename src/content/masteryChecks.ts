import type { Solvable } from "@/types/lesson";

/**
 * Hard "mastery check" questions appended to the END of each lesson. These are
 * deliberately tougher (difficulty 3) and multi-step so a learner has to truly
 * understand the idea - they're what make the 80% pass gate meaningful. They use
 * a mix of question types (multi-select, ordering, slider) to keep the finish of
 * each lesson fresh and interactive.
 *
 * Keyed by lesson id; merged into the course in `course.ts`.
 */
export const MASTERY_CHECKS: Record<string, Solvable[]> = {
  "constant-rate-change": [
    {
      id: "cr-mc-1",
      kind: "multi-select",
      prompt: "Select ALL situations that have a constant rate of change.",
      concepts: ["constant-rate"],
      difficulty: 3,
      options: [
        { id: "a", label: "y: 3, 6, 9, 12 (adds 3 each step)" },
        { id: "b", label: "Money doubles each year: $2, $4, $8, $16" },
        { id: "c", label: "A plane descends 500 ft every minute" },
        { id: "d", label: "Savings: $5, $9, $14, $20 (adds 4, then 5, then 6)" },
      ],
      correctOptionIds: ["a", "c"],
      wrongFeedback:
        "A constant rate adds the SAME amount each step. Doubling and growing gaps are not constant.",
      correctFeedback:
        "Exactly - only the ones that change by the same amount each step are constant.",
      explanation:
        "Constant rate means equal jumps every step. Adding 3 each time and dropping 500 ft each minute are steady; doubling and growing differences are not.",
    },
    {
      id: "cr-mc-2",
      kind: "numeric",
      prompt:
        "A pool already holds 20 liters and fills 6 liters per minute. How many liters after 5 minutes?",
      concepts: ["constant-rate"],
      difficulty: 3,
      acceptedAnswers: ["50"],
      placeholder: "liters",
      wrongFeedback: [
        {
          match: "30",
          feedback: "That's only the 6 x 5 it filled. Add the 20 liters it started with.",
          misconceptionTag: "ignored-start",
        },
        {
          match: "31",
          feedback: "That adds 20 + 6 + 5. Multiply 6 by 5 first, then add the 20.",
          misconceptionTag: "add-not-multiply",
        },
      ],
      genericHint: "Start amount + rate x time = 20 + 6 x 5.",
      correctFeedback: "50 liters - the 20 it started with plus 6 x 5 = 30 more.",
      explanation:
        "Begin with 20. A constant 6 L/min for 5 minutes adds 6 x 5 = 30. Total: 20 + 30 = 50.",
    },
  ],

  "slope-rise-run": [
    {
      id: "srr-mc-1",
      kind: "order",
      prompt: "Put the steps for finding a slope from two points in order.",
      concepts: ["slope-ratio", "rise", "run"],
      difficulty: 3,
      items: [
        { id: "pick", label: "Pick the two points on the line" },
        { id: "rise", label: "Subtract the y-values to get the rise" },
        { id: "run", label: "Subtract the x-values to get the run" },
        { id: "divide", label: "Divide rise by run to get the slope" },
      ],
      wrongFeedback:
        "You need both the rise and the run before you can divide. Find them first, then divide.",
      correctFeedback: "That's the process - find rise and run, then divide.",
      explanation:
        "Slope = rise / run. So you first pick two points, find the vertical change (rise) and horizontal change (run), then divide.",
    },
    {
      id: "srr-mc-2",
      kind: "numeric",
      prompt: "A line has a rise of -3 and a run of 6. What is its slope?",
      concepts: ["slope-ratio", "negative-slope"],
      difficulty: 3,
      acceptedAnswers: ["-1/2"],
      acceptDecimal: true,
      placeholder: "a fraction a/b",
      wrongFeedback: [
        {
          match: "1/2",
          feedback: "The rise is negative, so the line falls - the slope must be negative.",
          misconceptionTag: "dropped-sign",
        },
        {
          match: "-2",
          feedback: "That's run over rise. Slope is rise over run: -3/6.",
          misconceptionTag: "order-swap",
        },
      ],
      genericHint: "Slope = rise / run = -3 / 6.",
      correctFeedback: "Right - -3/6 simplifies to -1/2. A falling line has a negative slope.",
      explanation:
        "Rise over run is -3/6 = -1/2. The negative rise means the line goes down as it moves right.",
    },
    {
      id: "srr-mc-3",
      kind: "number-line",
      prompt:
        "A line rises 4 units for every 2 units it moves right. Drag the marker to its slope.",
      concepts: ["slope-ratio", "rise", "run"],
      difficulty: 3,
      min: -5,
      max: 5,
      step: 1,
      target: 2,
      tolerance: 0,
      wrongFeedback:
        "Slope = rise / run. Here that's 4 / 2 - simplify before placing the marker.",
      correctFeedback: "Right - 4 / 2 = 2, so the slope sits at 2 on the line.",
      explanation: "Slope = rise / run = 4 / 2 = 2.",
    },
  ],

  "slope-from-two-points": [
    {
      id: "sftp-mc-1",
      kind: "numeric",
      prompt: "Find the slope of the line through (-2, 5) and (2, -3).",
      concepts: ["slope-ratio", "negative-slope"],
      difficulty: 3,
      acceptedAnswers: ["-2"],
      acceptDecimal: true,
      placeholder: "slope = ?",
      wrongFeedback: [
        {
          match: "2",
          feedback: "The y-values drop from 5 to -3, so the slope is negative.",
          misconceptionTag: "dropped-sign",
        },
        {
          match: "-1/2",
          feedback: "You flipped rise and run. Rise (change in y) goes on top.",
          misconceptionTag: "order-swap",
        },
      ],
      genericHint: "Rise = -3 - 5 = -8, run = 2 - (-2) = 4. Then divide.",
      correctFeedback: "Yes - (-3 - 5) / (2 - (-2)) = -8/4 = -2.",
      explanation:
        "Change in y is -3 - 5 = -8. Change in x is 2 - (-2) = 4. Slope = -8 / 4 = -2.",
    },
    {
      id: "sftp-mc-2",
      kind: "multi-select",
      prompt: "Select ALL point pairs whose line has a slope of 3.",
      concepts: ["slope-ratio"],
      difficulty: 3,
      options: [
        { id: "a", label: "(0, 0) and (1, 3)" },
        { id: "b", label: "(1, 2) and (3, 8)" },
        { id: "c", label: "(2, 1) and (4, 4)" },
        { id: "d", label: "(-1, -3) and (0, 0)" },
        { id: "e", label: "(0, 0) and (3, 1)" },
      ],
      correctOptionIds: ["a", "b", "d"],
      wrongFeedback:
        "Compute (change in y) / (change in x) for each. Only the pairs that give exactly 3 count.",
      correctFeedback: "Nice - each of those gives rise/run = 3.",
      explanation:
        "(1,3): 3/1 = 3. (1,2)-(3,8): 6/2 = 3. (-1,-3)-(0,0): 3/1 = 3. The others give 3/2 and 1/3.",
    },
    {
      id: "sftp-mc-3",
      kind: "categorize",
      prompt:
        "Sort each pair of points by the sign of the slope of the line through them.",
      concepts: ["positive-slope", "negative-slope"],
      difficulty: 3,
      categories: [
        { id: "pos", label: "Positive slope" },
        { id: "neg", label: "Negative slope" },
      ],
      items: [
        { id: "p1", label: "(0, 0) and (2, 4)", categoryId: "pos" },
        { id: "p2", label: "(1, 5) and (3, 1)", categoryId: "neg" },
        { id: "p3", label: "(-2, -1) and (0, 3)", categoryId: "pos" },
        { id: "p4", label: "(0, 4) and (2, 0)", categoryId: "neg" },
      ],
      wrongFeedback:
        "Find rise / run for each. If y rises as x rises the slope is positive; if y falls it's negative.",
      correctFeedback: "Nice - rising pairs are positive, falling pairs are negative.",
      explanation:
        "(0,0)-(2,4): +4/2 = +2. (1,5)-(3,1): -4/2 = -2. (-2,-1)-(0,3): +4/2 = +2. (0,4)-(2,0): -4/2 = -2.",
    },
  ],

  "positive-negative-slope": [
    {
      id: "pns-mc-1",
      kind: "choice",
      prompt: "What kind of slope does the line through (1, 5) and (4, 2) have?",
      concepts: ["negative-slope"],
      difficulty: 3,
      variant: "list",
      options: [
        { id: "neg", label: "Negative - it falls from left to right" },
        { id: "pos", label: "Positive - it rises from left to right" },
        { id: "zero", label: "Zero - it's horizontal" },
        { id: "undef", label: "Undefined - it's vertical" },
      ],
      correctOptionId: "neg",
      wrongFeedback: {
        pos: {
          feedback: "The y-value drops from 5 to 2 as x grows, so the line falls.",
          misconceptionTag: "sign-direction",
        },
        zero: {
          feedback: "A zero slope means y never changes, but here it goes 5 -> 2.",
          misconceptionTag: "zero-slope",
        },
        undef: {
          feedback: "Undefined slope needs the same x twice. Here x changes 1 -> 4.",
          misconceptionTag: "undefined-slope",
        },
      },
      correctFeedback: "Right - slope = (2 - 5)/(4 - 1) = -1, a falling line.",
      explanation:
        "From (1,5) to (4,2): rise = -3, run = 3, slope = -1. A negative slope falls as x increases.",
    },
    {
      id: "pns-mc-2",
      kind: "multi-select",
      prompt: "Select ALL lines that have a negative slope.",
      concepts: ["negative-slope", "positive-slope"],
      difficulty: 3,
      options: [
        { id: "a", label: "Goes down 2 for every 1 step right" },
        { id: "b", label: "Passes through (0, 4) and (2, 0)" },
        { id: "c", label: "Passes through (1, 1) and (3, 5)" },
        { id: "d", label: "A horizontal line at y = 3" },
        { id: "e", label: "Falls as x increases" },
      ],
      correctOptionIds: ["a", "b", "e"],
      wrongFeedback:
        "A negative slope falls as you move right. A rising line and a horizontal line are not negative.",
      correctFeedback: "Exactly - all of those fall as x increases.",
      explanation:
        "(0,4)-(2,0) gives slope -2; 'down 2 per 1 right' and 'falls as x increases' are negative. The rising pair is +2 and the horizontal line is 0.",
    },
    {
      id: "pns-mc-3",
      kind: "categorize",
      prompt: "Sort each line by the kind of slope it has.",
      concepts: ["positive-slope", "negative-slope"],
      difficulty: 3,
      categories: [
        { id: "pos", label: "Positive" },
        { id: "neg", label: "Negative" },
        { id: "zero", label: "Zero" },
      ],
      items: [
        { id: "i1", label: "Rises from (0, 0) to (3, 6)", categoryId: "pos" },
        { id: "i2", label: "Falls from (0, 5) to (4, 1)", categoryId: "neg" },
        { id: "i3", label: "Horizontal line y = 2", categoryId: "zero" },
        { id: "i4", label: "Goes up 1 for every 2 right", categoryId: "pos" },
        { id: "i5", label: "Drops 3 for every 1 right", categoryId: "neg" },
      ],
      wrongFeedback:
        "Up-to-the-right is positive, down-to-the-right is negative, and perfectly flat is zero.",
      correctFeedback: "Nice sorting - a line's direction tells you the sign of its slope.",
      explanation:
        "A line rising to the right has positive slope, one falling to the right is negative, and a flat line has slope 0.",
    },
  ],

  "y-intercept": [
    {
      id: "yi-mc-1",
      kind: "numeric",
      prompt: "What is the y-intercept of the line y = -2x + 7?",
      concepts: ["slope-ratio"],
      difficulty: 3,
      acceptedAnswers: ["7"],
      placeholder: "b = ?",
      wrongFeedback: [
        {
          match: "-2",
          feedback: "That's the slope (the number times x). The y-intercept is the constant.",
          misconceptionTag: "slope-vs-intercept",
        },
        {
          match: "-7",
          feedback: "The constant is +7, so the line crosses the y-axis at 7.",
          misconceptionTag: "sign-error",
        },
      ],
      genericHint: "In y = mx + b, b is the y-intercept.",
      correctFeedback: "Yes - the +7 is where the line crosses the y-axis.",
      explanation:
        "In y = mx + b, the y-intercept is b. Here y = -2x + 7, so b = 7.",
    },
    {
      id: "yi-mc-2",
      kind: "slider",
      prompt: "Set the slider to the y-intercept of the line y = 3x - 4.",
      concepts: ["slope-ratio"],
      difficulty: 3,
      min: -10,
      max: 10,
      target: -4,
      tolerance: 0,
      wrongFeedback:
        "The y-intercept is the constant term b in y = mx + b - the value when x = 0.",
      correctFeedback: "Right - when x = 0, y = -4, so the y-intercept is -4.",
      explanation:
        "Set x = 0: y = 3(0) - 4 = -4. The y-intercept is the constant -4.",
    },
    {
      id: "yi-mc-3",
      kind: "number-line",
      prompt: "Drag the marker to the y-intercept of y = (1/2)x - 3.",
      concepts: ["slope-ratio"],
      difficulty: 3,
      min: -6,
      max: 6,
      step: 1,
      target: -3,
      tolerance: 0,
      wrongFeedback:
        "The y-intercept is the constant b in y = mx + b - the value of y when x = 0.",
      correctFeedback: "Right - at x = 0, y = -3, so the y-intercept is -3.",
      explanation:
        "In y = mx + b, b is the y-intercept. Here y = (1/2)x - 3, so b = -3.",
    },
  ],

  "slope-intercept-form": [
    {
      id: "sif-mc-1",
      kind: "order",
      prompt: "Order the steps to graph y = 2x + 1.",
      concepts: ["slope-ratio", "constant-slope"],
      difficulty: 3,
      items: [
        { id: "plot", label: "Plot the y-intercept at (0, 1)" },
        { id: "up", label: "From there, use the slope: go up 2" },
        { id: "right", label: "Then go right 1 to reach the next point" },
        { id: "draw", label: "Draw a straight line through the points" },
      ],
      wrongFeedback:
        "Start at the y-intercept, then use the slope (rise over run) to step to the next point, then draw.",
      correctFeedback: "That's it - intercept first, then step by the slope, then draw.",
      explanation:
        "Graph y = mx + b by plotting b first (0,1), then using the slope 2 = up 2 / right 1 to find another point, then connecting them.",
    },
    {
      id: "sif-mc-2",
      kind: "multi-select",
      prompt: "For the line y = -3x + 2, select ALL statements that are true.",
      concepts: ["slope-ratio", "negative-slope"],
      difficulty: 3,
      options: [
        { id: "a", label: "The slope is -3" },
        { id: "b", label: "It crosses the y-axis at 2" },
        { id: "c", label: "It rises as x increases" },
        { id: "d", label: "The y-intercept is -3" },
        { id: "e", label: "For every 1 step right, it drops 3" },
      ],
      correctOptionIds: ["a", "b", "e"],
      wrongFeedback:
        "Read m and b from y = mx + b. m = -3 is the slope (line falls), b = 2 is the y-intercept.",
      correctFeedback: "Exactly - slope -3 (falling, down 3 per right 1) and y-intercept 2.",
      explanation:
        "y = -3x + 2: slope m = -3 means it falls 3 for each step right; b = 2 is where it crosses the y-axis.",
    },
    {
      id: "sif-mc-3",
      kind: "table-fill",
      prompt: "Fill in the missing y-values for the line y = -2x + 5.",
      concepts: ["slope-ratio", "negative-slope"],
      difficulty: 3,
      columns: { x: "x", y: "y" },
      rows: [
        { label: "0", answer: "5" },
        { label: "1", answer: "3" },
        { label: "2", answer: "1" },
        { label: "3", answer: "-1" },
      ],
      acceptDecimal: true,
      wrongFeedback:
        "Use y = -2x + 5 for each row: multiply x by -2, then add 5.",
      correctFeedback: "Yes - each step right drops y by 2: 5, 3, 1, -1.",
      explanation:
        "y = -2x + 5 gives y = 5, 3, 1, -1 for x = 0, 1, 2, 3 (down 2 each step).",
    },
  ],

  "proportional-relationships": [
    {
      id: "pr-mc-1",
      kind: "numeric",
      prompt:
        "A proportional relationship passes through (4, 10). What is its unit rate (slope)?",
      concepts: ["slope-ratio", "constant-rate"],
      difficulty: 3,
      acceptedAnswers: ["5/2", "2.5"],
      acceptDecimal: true,
      placeholder: "a number or fraction",
      wrongFeedback: [
        {
          match: "4/10",
          feedback: "Flip it: unit rate is y per x, so 10/4, not 4/10.",
          misconceptionTag: "order-swap",
        },
        {
          match: "6",
          feedback: "That subtracts 10 - 4. Unit rate divides: 10 / 4.",
          misconceptionTag: "subtract-not-divide",
        },
      ],
      genericHint: "Unit rate = y / x = 10 / 4.",
      correctFeedback: "Yes - 10/4 = 5/2 = 2.5 per unit.",
      explanation:
        "A proportional relationship is y = kx through the origin. k = y/x = 10/4 = 2.5.",
    },
    {
      id: "pr-mc-2",
      kind: "multi-select",
      prompt: "Select ALL equations that represent a proportional relationship.",
      concepts: ["slope-ratio", "constant-rate"],
      difficulty: 3,
      options: [
        { id: "a", label: "y = 4x" },
        { id: "b", label: "y = 4x + 3" },
        { id: "c", label: "y = 0.5x" },
        { id: "d", label: "y = 7" },
        { id: "e", label: "y = -2x" },
      ],
      correctOptionIds: ["a", "c", "e"],
      wrongFeedback:
        "Proportional means y = kx - a straight line through the origin with no added constant.",
      correctFeedback: "Right - those are all y = kx through the origin.",
      explanation:
        "A proportional relationship has the form y = kx (passes through (0,0)). Adding a constant (+3) or a flat line (y = 7) breaks proportionality.",
    },
  ],

  "match-representations": [
    {
      id: "mr-mc-1",
      kind: "multi-select",
      prompt:
        "A line has slope 2 and passes through (0, -1). Select ALL representations that match it.",
      concepts: ["slope-ratio", "constant-slope"],
      difficulty: 3,
      options: [
        { id: "a", label: "y = 2x - 1" },
        { id: "b", label: "It passes through (1, 1)" },
        { id: "c", label: "Its y-intercept is -1" },
        { id: "d", label: "Table: x: 0, 1, 2  ->  y: -1, 0, 2" },
        { id: "e", label: "Its slope is -2" },
      ],
      correctOptionIds: ["a", "b", "c"],
      wrongFeedback:
        "Use y = 2x - 1. Check each: plug in points, read the intercept, and confirm the slope.",
      correctFeedback: "Exactly - all of those describe y = 2x - 1.",
      explanation:
        "y = 2x - 1: intercept -1, and at x = 1, y = 1. The table should read -1, 1, 3 (not -1, 0, 2), and the slope is +2, not -2.",
    },
    {
      id: "mr-mc-2",
      kind: "order",
      prompt:
        "A line goes through (0, 2) and (3, 8). Order the steps to write its equation.",
      concepts: ["slope-ratio", "constant-slope"],
      difficulty: 3,
      items: [
        { id: "riserun", label: "Find the rise (6) and run (3) between the points" },
        { id: "slope", label: "Divide to get the slope: 6 / 3 = 2" },
        { id: "intercept", label: "Read the y-intercept from (0, 2): b = 2" },
        { id: "combine", label: "Combine into y = 2x + 2" },
      ],
      wrongFeedback:
        "Find the slope from the two points first, then read the y-intercept, then put them together.",
      correctFeedback: "That's the path from two points to y = mx + b.",
      explanation:
        "Rise 6 over run 3 gives slope 2. The point (0,2) gives intercept 2. So y = 2x + 2.",
    },
    {
      id: "mr-mc-3",
      kind: "table-fill",
      prompt: "Complete the table of values for y = 2x + 1.",
      concepts: ["slope-ratio", "constant-slope"],
      difficulty: 3,
      columns: { x: "x", y: "y" },
      rows: [
        { label: "0", answer: "1" },
        { label: "1", answer: "3" },
        { label: "2", answer: "5" },
        { label: "3", answer: "7" },
      ],
      acceptDecimal: true,
      wrongFeedback:
        "Plug each x into y = 2x + 1: double x, then add 1.",
      correctFeedback: "Perfect - y goes up by 2 each step: 1, 3, 5, 7.",
      explanation:
        "y = 2x + 1 gives y = 1, 3, 5, 7 for x = 0, 1, 2, 3.",
    },
  ],

  "real-world-lines": [
    {
      id: "rwl-mc-1",
      kind: "numeric",
      prompt:
        "A gym costs $25 to join plus $15 each month. What is the total cost after 6 months?",
      concepts: ["constant-rate", "slope-ratio"],
      difficulty: 3,
      acceptedAnswers: ["115"],
      placeholder: "$ ?",
      wrongFeedback: [
        {
          match: "90",
          feedback: "That's only 15 x 6. Add the one-time $25 join fee.",
          misconceptionTag: "ignored-intercept",
        },
        {
          match: "46",
          feedback: "That adds 25 + 15 + 6. The $15 is per month - multiply by 6 first.",
          misconceptionTag: "add-not-multiply",
        },
      ],
      genericHint: "Total = join fee + monthly x months = 25 + 15 x 6.",
      correctFeedback: "Yes - $25 + $15 x 6 = $25 + $90 = $115.",
      explanation:
        "This is y = 15x + 25 with x = 6: 15(6) + 25 = 90 + 25 = 115. The $25 is the y-intercept (start), $15 is the slope (rate).",
    },
    {
      id: "rwl-mc-2",
      kind: "slider",
      prompt:
        "A candle is 20 cm tall and burns 2 cm every hour. Set the slider to its height after 6 hours.",
      concepts: ["constant-rate", "slope-ratio"],
      difficulty: 3,
      min: 0,
      max: 20,
      step: 1,
      target: 8,
      tolerance: 0,
      unit: " cm",
      wrongFeedback:
        "It starts at 20 and loses 2 cm each hour. After 6 hours it has lost 2 x 6 = 12 cm.",
      correctFeedback: "Right - 20 - 2 x 6 = 20 - 12 = 8 cm.",
      explanation:
        "Height = 20 - 2x. At x = 6: 20 - 12 = 8 cm. The negative slope (-2) means it shrinks over time.",
    },
  ],
};
