import { describe, expect, it } from "vitest";
import { validateSolvable } from "@/features/lesson/validate";
import type {
  CategorizeSolvable,
  ChoiceSolvable,
  GraphConfig,
  GraphTargetSolvable,
  MultiSelectSolvable,
  NumberLineSolvable,
  NumericSolvable,
  ObserveSolvable,
  OrderSolvable,
  SliderSolvable,
  TableFillSolvable,
} from "@/types/lesson";

/** Shared BaseSolvable fields for fixtures. */
const base = {
  prompt: "Prompt",
  concepts: [] as [],
  correctFeedback: "Nice!",
  explanation: "Because slope is rise over run.",
};

const graph: GraphConfig = {
  xMin: -5,
  xMax: 5,
  yMin: -5,
  yMax: 5,
  pointA: { x: 0, y: 0 },
  pointB: { x: 3, y: 2 },
  draggable: "B",
  showLine: true,
  showTriangle: true,
  showSlopeLabel: true,
  highlight: "none",
};

describe("validateSolvable — observe", () => {
  const solvable: ObserveSolvable = {
    ...base,
    id: "obs",
    kind: "observe",
    graph,
    minInteractions: 2,
  };

  it("is correct once the learner has interacted enough", () => {
    const result = validateSolvable(solvable, { kind: "observe", interactions: 3 });
    expect(result.isCorrect).toBe(true);
    expect(result.feedback).toBe("Nice!");
  });

  it("is incorrect when there are too few interactions", () => {
    const result = validateSolvable(solvable, { kind: "observe", interactions: 1 });
    expect(result.isCorrect).toBe(false);
  });
});

describe("validateSolvable — numeric", () => {
  const solvable: NumericSolvable = {
    ...base,
    id: "num",
    kind: "numeric",
    acceptedAnswers: ["2/3"],
    acceptDecimal: true,
    wrongFeedback: [
      { match: "3/2", feedback: "You flipped rise and run.", misconceptionTag: "order-swap" },
    ],
    genericHint: "Slope is rise over run.",
  };

  it("accepts the canonical fraction answer", () => {
    const result = validateSolvable(solvable, { kind: "numeric", text: "2/3" });
    expect(result.isCorrect).toBe(true);
    expect(result.misconceptionTag).toBeNull();
  });

  it("accepts an equivalent fraction within decimal tolerance", () => {
    const result = validateSolvable(solvable, { kind: "numeric", text: "4/6" });
    expect(result.isCorrect).toBe(true);
  });

  it("returns the targeted hint for a known wrong answer", () => {
    const result = validateSolvable(solvable, { kind: "numeric", text: "3/2" });
    expect(result.isCorrect).toBe(false);
    expect(result.feedback).toBe("You flipped rise and run.");
    expect(result.misconceptionTag).toBe("order-swap");
  });

  it("falls back to the generic hint for an unrecognized wrong answer", () => {
    const result = validateSolvable(solvable, { kind: "numeric", text: "9" });
    expect(result.isCorrect).toBe(false);
    expect(result.feedback).toBe("Slope is rise over run.");
    expect(result.misconceptionTag).toBeNull();
  });
});

describe("validateSolvable — choice", () => {
  const solvable: ChoiceSolvable = {
    ...base,
    id: "ch",
    kind: "choice",
    options: [
      { id: "a", label: "2/3" },
      { id: "b", label: "3/2" },
    ],
    correctOptionId: "a",
    wrongFeedback: {
      b: { feedback: "That's rise and run swapped.", misconceptionTag: "order-swap" },
    },
  };

  it("is correct for the right option", () => {
    const result = validateSolvable(solvable, { kind: "choice", optionId: "a" });
    expect(result.isCorrect).toBe(true);
  });

  it("returns the per-option hint for a wrong option", () => {
    const result = validateSolvable(solvable, { kind: "choice", optionId: "b" });
    expect(result.isCorrect).toBe(false);
    expect(result.feedback).toBe("That's rise and run swapped.");
    expect(result.misconceptionTag).toBe("order-swap");
  });

  it("prompts to pick when nothing is selected", () => {
    const result = validateSolvable(solvable, { kind: "choice", optionId: null });
    expect(result.isCorrect).toBe(false);
  });
});

describe("validateSolvable — graph-target", () => {
  const solvable: GraphTargetSolvable = {
    ...base,
    id: "gt",
    kind: "graph-target",
    graph,
    targetSlope: { rise: 2, run: 3 },
    feedback: {
      swapped: "You swapped rise and run.",
      negative: "Check the sign — that slope is negative.",
      verticalRun0: "A vertical line has an undefined slope.",
      generic: "Not the target slope yet.",
    },
  };

  it("is correct for an equivalent ratio", () => {
    const result = validateSolvable(solvable, {
      kind: "graph-target",
      pointA: { x: 0, y: 0 },
      pointB: { x: 6, y: 4 },
    });
    expect(result.isCorrect).toBe(true);
  });

  it("flags a vertical (run 0) answer", () => {
    const result = validateSolvable(solvable, {
      kind: "graph-target",
      pointA: { x: 0, y: 0 },
      pointB: { x: 0, y: 2 },
    });
    expect(result.isCorrect).toBe(false);
    expect(result.misconceptionTag).toBe("undefined-slope");
  });

  it("flags a negative slope", () => {
    const result = validateSolvable(solvable, {
      kind: "graph-target",
      pointA: { x: 0, y: 0 },
      pointB: { x: 3, y: -2 },
    });
    expect(result.isCorrect).toBe(false);
    expect(result.misconceptionTag).toBe("dropped-sign");
  });

  it("flags a swapped rise/run", () => {
    const result = validateSolvable(solvable, {
      kind: "graph-target",
      pointA: { x: 0, y: 0 },
      pointB: { x: 2, y: 3 },
    });
    expect(result.isCorrect).toBe(false);
    expect(result.misconceptionTag).toBe("order-swap");
  });
});

describe("validateSolvable — multi-select", () => {
  const solvable: MultiSelectSolvable = {
    ...base,
    id: "ms",
    kind: "multi-select",
    options: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
    ],
    correctOptionIds: ["a", "c"],
  };

  it("is correct when the exact set is chosen", () => {
    const result = validateSolvable(solvable, { kind: "multi-select", optionIds: ["c", "a"] });
    expect(result.isCorrect).toBe(true);
  });

  it("is incorrect when an extra option is included", () => {
    const result = validateSolvable(solvable, {
      kind: "multi-select",
      optionIds: ["a", "b", "c"],
    });
    expect(result.isCorrect).toBe(false);
  });
});

describe("validateSolvable — order", () => {
  const solvable: OrderSolvable = {
    ...base,
    id: "ord",
    kind: "order",
    items: [
      { id: "1", label: "First" },
      { id: "2", label: "Second" },
      { id: "3", label: "Third" },
    ],
  };

  it("is correct in the authored order", () => {
    const result = validateSolvable(solvable, { kind: "order", orderedIds: ["1", "2", "3"] });
    expect(result.isCorrect).toBe(true);
  });

  it("is incorrect when out of order", () => {
    const result = validateSolvable(solvable, { kind: "order", orderedIds: ["2", "1", "3"] });
    expect(result.isCorrect).toBe(false);
  });
});

describe("validateSolvable — slider", () => {
  const solvable: SliderSolvable = {
    ...base,
    id: "sl",
    kind: "slider",
    min: 0,
    max: 10,
    target: 5,
    tolerance: 0.5,
    unit: "%",
  };

  it("is correct within tolerance", () => {
    const result = validateSolvable(solvable, { kind: "slider", value: 5.3 });
    expect(result.isCorrect).toBe(true);
  });

  it("is incorrect outside tolerance", () => {
    const result = validateSolvable(solvable, { kind: "slider", value: 8 });
    expect(result.isCorrect).toBe(false);
  });
});

describe("validateSolvable — categorize", () => {
  const solvable: CategorizeSolvable = {
    ...base,
    id: "cat",
    kind: "categorize",
    categories: [
      { id: "pos", label: "Positive" },
      { id: "neg", label: "Negative" },
    ],
    items: [
      { id: "i1", label: "Up", categoryId: "pos" },
      { id: "i2", label: "Down", categoryId: "neg" },
    ],
  };

  it("is correct when every item is in the right bucket", () => {
    const result = validateSolvable(solvable, {
      kind: "categorize",
      placement: { i1: "pos", i2: "neg" },
    });
    expect(result.isCorrect).toBe(true);
  });

  it("is incorrect when an item is misplaced", () => {
    const result = validateSolvable(solvable, {
      kind: "categorize",
      placement: { i1: "neg", i2: "neg" },
    });
    expect(result.isCorrect).toBe(false);
  });
});

describe("validateSolvable — number-line", () => {
  const solvable: NumberLineSolvable = {
    ...base,
    id: "nl",
    kind: "number-line",
    min: -10,
    max: 10,
    target: -3,
    tolerance: 0.25,
  };

  it("is correct within tolerance", () => {
    const result = validateSolvable(solvable, { kind: "number-line", value: -3 });
    expect(result.isCorrect).toBe(true);
  });

  it("is incorrect outside tolerance", () => {
    const result = validateSolvable(solvable, { kind: "number-line", value: 2 });
    expect(result.isCorrect).toBe(false);
  });
});

describe("validateSolvable — table-fill", () => {
  const solvable: TableFillSolvable = {
    ...base,
    id: "tf",
    kind: "table-fill",
    columns: { x: "x", y: "y" },
    rows: [
      { label: "1", answer: "2" },
      { label: "2", answer: "4" },
    ],
    acceptDecimal: true,
  };

  it("is correct when every cell matches", () => {
    const result = validateSolvable(solvable, { kind: "table-fill", values: ["2", "4"] });
    expect(result.isCorrect).toBe(true);
  });

  it("is incorrect when a cell is wrong", () => {
    const result = validateSolvable(solvable, { kind: "table-fill", values: ["2", "5"] });
    expect(result.isCorrect).toBe(false);
  });
});

describe("validateSolvable — mismatched answer kind", () => {
  it("returns a safe error result", () => {
    const solvable: NumericSolvable = {
      ...base,
      id: "num2",
      kind: "numeric",
      acceptedAnswers: ["2"],
      wrongFeedback: [],
      genericHint: "hint",
    };
    const result = validateSolvable(solvable, { kind: "choice", optionId: "a" });
    expect(result.isCorrect).toBe(false);
  });
});
