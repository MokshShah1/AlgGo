import type { Point, Solvable } from "@/types/lesson";
import { formatSlope, normalizeAnswer, parseNumeric } from "@/lib/fraction";

export interface ValidationResult {
  isCorrect: boolean;
  feedback: string;
  misconceptionTag: string | null;
  /** Human-readable answer recorded on the attempt. */
  answerText: string;
}

export type SolvableAnswer =
  | { kind: "observe"; interactions: number }
  | { kind: "numeric"; text: string }
  | { kind: "choice"; optionId: string | null }
  | { kind: "graph-target"; pointA: Point; pointB: Point }
  | { kind: "multi-select"; optionIds: string[] }
  | { kind: "order"; orderedIds: string[] }
  | { kind: "slider"; value: number }
  | { kind: "categorize"; placement: Record<string, string> }
  | { kind: "number-line"; value: number }
  | { kind: "table-fill"; values: string[] };

const DECIMAL_TOLERANCE = 0.02;

export function validateSolvable(
  solvable: Solvable,
  answer: SolvableAnswer
): ValidationResult {
  switch (solvable.kind) {
    case "observe": {
      if (answer.kind !== "observe") break;
      const ok = answer.interactions >= solvable.minInteractions;
      return {
        isCorrect: ok,
        feedback: ok ? solvable.correctFeedback : "Try dragging the point first.",
        misconceptionTag: null,
        answerText: `dragged x${answer.interactions}`,
      };
    }

    case "numeric": {
      if (answer.kind !== "numeric") break;
      const text = answer.text;
      const value = parseNumeric(text);
      const normalized = normalizeAnswer(text);

      const correct = solvable.acceptedAnswers.some((accepted) => {
        const target = parseNumeric(accepted);
        if (target === null || value === null) {
          return normalizeAnswer(accepted) === normalized;
        }
        const tolerance = solvable.acceptDecimal ? DECIMAL_TOLERANCE : 1e-9;
        return Math.abs(value - target) <= tolerance;
      });

      if (correct) {
        return {
          isCorrect: true,
          feedback: solvable.correctFeedback,
          misconceptionTag: null,
          answerText: text,
        };
      }

      const rule = solvable.wrongFeedback.find(
        (r) => normalizeAnswer(r.match) === normalized
      );
      return {
        isCorrect: false,
        feedback: rule?.feedback ?? solvable.genericHint,
        misconceptionTag: rule?.misconceptionTag ?? null,
        answerText: text,
      };
    }

    case "choice": {
      if (answer.kind !== "choice") break;
      const optionId = answer.optionId;
      if (!optionId) {
        return {
          isCorrect: false,
          feedback: "Pick an answer to check.",
          misconceptionTag: null,
          answerText: "",
        };
      }
      if (optionId === solvable.correctOptionId) {
        return {
          isCorrect: true,
          feedback: solvable.correctFeedback,
          misconceptionTag: null,
          answerText: optionId,
        };
      }
      const wrong = solvable.wrongFeedback[optionId];
      return {
        isCorrect: false,
        feedback: wrong?.feedback ?? "Not quite - take another look.",
        misconceptionTag: wrong?.misconceptionTag ?? null,
        answerText: optionId,
      };
    }

    case "graph-target": {
      if (answer.kind !== "graph-target") break;
      const rise = answer.pointB.y - answer.pointA.y;
      const run = answer.pointB.x - answer.pointA.x;
      const { rise: tRise, run: tRun } = solvable.targetSlope;
      const answerText = `B(${answer.pointB.x},${answer.pointB.y}) slope ${formatSlope(rise, run)}`;

      if (run === 0) {
        return {
          isCorrect: false,
          feedback: solvable.feedback.verticalRun0,
          misconceptionTag: "undefined-slope",
          answerText,
        };
      }

      // Equivalent positive ratio (e.g. 2/3, 4/6) is correct.
      if (rise * tRun === run * tRise) {
        return {
          isCorrect: true,
          feedback: solvable.correctFeedback,
          misconceptionTag: null,
          answerText,
        };
      }

      if (rise / run < 0) {
        return {
          isCorrect: false,
          feedback: solvable.feedback.negative,
          misconceptionTag: "dropped-sign",
          answerText,
        };
      }

      // Swapped numerator/denominator (e.g. 3/2 instead of 2/3).
      if (rise * tRise === run * tRun) {
        return {
          isCorrect: false,
          feedback: solvable.feedback.swapped,
          misconceptionTag: "order-swap",
          answerText,
        };
      }

      return {
        isCorrect: false,
        feedback: solvable.feedback.generic,
        misconceptionTag: null,
        answerText,
      };
    }

    case "multi-select": {
      if (answer.kind !== "multi-select") break;
      const chosen = new Set(answer.optionIds);
      const target = new Set(solvable.correctOptionIds);
      const ok =
        chosen.size === target.size &&
        [...target].every((id) => chosen.has(id));
      return {
        isCorrect: ok,
        feedback: ok
          ? solvable.correctFeedback
          : solvable.wrongFeedback ??
            "Not quite - make sure you've picked every correct option and none of the wrong ones.",
        misconceptionTag: null,
        answerText: answer.optionIds.join(","),
      };
    }

    case "order": {
      if (answer.kind !== "order") break;
      const target = solvable.items.map((i) => i.id);
      const ok =
        answer.orderedIds.length === target.length &&
        answer.orderedIds.every((id, i) => id === target[i]);
      return {
        isCorrect: ok,
        feedback: ok
          ? solvable.correctFeedback
          : solvable.wrongFeedback ?? "Close - check the order and try again.",
        misconceptionTag: null,
        answerText: answer.orderedIds.join(" > "),
      };
    }

    case "slider": {
      if (answer.kind !== "slider") break;
      const tol = solvable.tolerance ?? 0;
      const ok = Math.abs(answer.value - solvable.target) <= tol;
      return {
        isCorrect: ok,
        feedback: ok
          ? solvable.correctFeedback
          : solvable.wrongFeedback ??
            "Not quite - nudge the slider closer to the right value.",
        misconceptionTag: null,
        answerText: `${answer.value}${solvable.unit ?? ""}`,
      };
    }

    case "categorize": {
      if (answer.kind !== "categorize") break;
      const ok = solvable.items.every(
        (item) => answer.placement[item.id] === item.categoryId
      );
      return {
        isCorrect: ok,
        feedback: ok
          ? solvable.correctFeedback
          : solvable.wrongFeedback ??
            "Not quite - one or more items are in the wrong group. Take another look.",
        misconceptionTag: null,
        answerText: solvable.items
          .map((item) => `${item.id}:${answer.placement[item.id] ?? "?"}`)
          .join(", "),
      };
    }

    case "number-line": {
      if (answer.kind !== "number-line") break;
      const tol = solvable.tolerance ?? 0;
      const ok = Math.abs(answer.value - solvable.target) <= tol;
      return {
        isCorrect: ok,
        feedback: ok
          ? solvable.correctFeedback
          : solvable.wrongFeedback ??
            "Not quite - slide the marker closer to the right value.",
        misconceptionTag: null,
        answerText: `${answer.value}${solvable.unit ?? ""}`,
      };
    }

    case "table-fill": {
      if (answer.kind !== "table-fill") break;
      const ok = solvable.rows.every((row, i) => {
        const text = answer.values[i] ?? "";
        const value = parseNumeric(text);
        const target = parseNumeric(row.answer);
        if (target === null || value === null) {
          return normalizeAnswer(row.answer) === normalizeAnswer(text);
        }
        const tolerance = solvable.acceptDecimal ? DECIMAL_TOLERANCE : 1e-9;
        return Math.abs(value - target) <= tolerance;
      });
      return {
        isCorrect: ok,
        feedback: ok
          ? solvable.correctFeedback
          : solvable.wrongFeedback ??
            "Not quite - check each value against the rule and try again.",
        misconceptionTag: null,
        answerText: answer.values.join(", "),
      };
    }
  }

  // Mismatched answer kind (should not happen).
  return {
    isCorrect: false,
    feedback: "Something went wrong checking that answer.",
    misconceptionTag: null,
    answerText: "",
  };
}
