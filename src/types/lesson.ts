import type { ConceptId } from "@/types/concepts";

/** A grid coordinate on the coordinate plane. */
export interface Point {
  x: number;
  y: number;
}

/** Which leg of the rise/run triangle to emphasize. */
export type GraphHighlight = "none" | "rise" | "run";

/** Which points the learner may drag. */
export type Draggable = "none" | "A" | "B" | "both";

/**
 * Declarative description of the SVG coordinate plane for a solvable.
 * The CoordinatePlane component renders from this; the lesson player updates
 * point positions as the learner drags.
 */
export interface GraphConfig {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  pointA: Point;
  pointB: Point;
  draggable: Draggable;
  showLine: boolean;
  showTriangle: boolean;
  showSlopeLabel: boolean;
  highlight: GraphHighlight;
  /** Prevent identical x-values so MVP never hits divide-by-zero while dragging. */
  preventVertical?: boolean;
}

/** Rule mapping a specific wrong answer to hand-written feedback. */
export interface WrongAnswerRule {
  /** Normalized answer that triggers this feedback (e.g. "3", "3/2", "run-rise"). */
  match: string;
  feedback: string;
  misconceptionTag?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
}

export type SolvableKind =
  | "observe"
  | "numeric"
  | "choice"
  | "graph-target"
  | "multi-select"
  | "order"
  | "slider"
  | "categorize"
  | "number-line"
  | "table-fill";

/** Relative challenge of a step. Used to ramp difficulty within a lesson. */
export type Difficulty = 1 | 2 | 3;

interface BaseSolvable {
  id: string;
  kind: SolvableKind;
  prompt: string;
  /** Concepts this step provides evidence for (mastery). */
  concepts: ConceptId[];
  /** Shown on a correct answer. */
  correctFeedback: string;
  /** Step-by-step reveal shown via "Show explanation" after repeated misses. */
  explanation: string;
  /**
   * Optional authored difficulty. When omitted the lesson player derives a
   * ramp from the step's position (later steps = harder).
   */
  difficulty?: Difficulty;
}

/**
 * Solvable 1-style step: the learner just interacts (drags) to build intuition.
 * Correct condition is "interacted at least once".
 */
export interface ObserveSolvable extends BaseSolvable {
  kind: "observe";
  graph: GraphConfig;
  /** Minimum number of drags required to satisfy the step. */
  minInteractions: number;
}

/** Numeric / fraction input step (rise, run, compute slope). */
export interface NumericSolvable extends BaseSolvable {
  kind: "numeric";
  graph?: GraphConfig;
  /**
   * Canonical accepted answers, normalized (e.g. ["2"], ["2/3"]).
   * The validator also accepts decimal equivalents within tolerance when
   * `acceptDecimal` is true.
   */
  acceptedAnswers: string[];
  acceptDecimal?: boolean;
  wrongFeedback: WrongAnswerRule[];
  genericHint: string;
  /** Placeholder / hint text for the input. */
  placeholder?: string;
}

/** Multiple-choice / tile-select step. */
export interface ChoiceSolvable extends BaseSolvable {
  kind: "choice";
  graph?: GraphConfig;
  options: ChoiceOption[];
  correctOptionId: string;
  /** Feedback keyed by the chosen (wrong) option id. */
  wrongFeedback: Record<string, { feedback: string; misconceptionTag?: string }>;
  /** Presentation hint: large tiles vs a vertical list. */
  variant?: "tiles" | "list";
}

/** Direct-manipulation step: drag point B until the line hits a target slope. */
export interface GraphTargetSolvable extends BaseSolvable {
  kind: "graph-target";
  graph: GraphConfig;
  /** Target slope as an integer rise/run pair (equivalent ratios accepted). */
  targetSlope: { rise: number; run: number };
  feedback: {
    swapped: string;
    negative: string;
    verticalRun0: string;
    generic: string;
  };
}

/** Select-all-that-apply step. Correct when the exact set is chosen. */
export interface MultiSelectSolvable extends BaseSolvable {
  kind: "multi-select";
  graph?: GraphConfig;
  options: ChoiceOption[];
  /** Every option id that must be selected (and no others). */
  correctOptionIds: string[];
  wrongFeedback?: string;
}

/** Put the items in the right order (drag/reorder). */
export interface OrderSolvable extends BaseSolvable {
  kind: "order";
  /** Items listed in their CORRECT order; presented shuffled to the learner. */
  items: ChoiceOption[];
  wrongFeedback?: string;
}

/** Estimate / set a value on a slider. Correct within an optional tolerance. */
export interface SliderSolvable extends BaseSolvable {
  kind: "slider";
  graph?: GraphConfig;
  min: number;
  max: number;
  step?: number;
  target: number;
  /** Accepted absolute distance from target (default 0 = exact). */
  tolerance?: number;
  unit?: string;
  wrongFeedback?: string;
}

/** A labeled bucket items get sorted into. */
export interface Category {
  id: string;
  label: string;
}

/** A draggable/tappable item that belongs in exactly one category. */
export interface CategorizeItem {
  id: string;
  label: string;
  /** The id of the category this item belongs in. */
  categoryId: string;
}

/**
 * Sorting step: the learner places every item into its correct bucket.
 * Correct only when EVERY item sits in its correct category.
 */
export interface CategorizeSolvable extends BaseSolvable {
  kind: "categorize";
  categories: Category[];
  items: CategorizeItem[];
  wrongFeedback?: string;
}

/** One row of a fill-in table: a fixed label and the expected (normalized) answer. */
export interface TableFillRow {
  /** The given value shown to the learner (e.g. the x-value). */
  label: string;
  /** The expected answer for this row, normalized like NumericSolvable. */
  answer: string;
}

/**
 * Drag a marker along a horizontal number line to a target value.
 * Correct when |value - target| <= tolerance (default 0).
 */
export interface NumberLineSolvable extends BaseSolvable {
  kind: "number-line";
  min: number;
  max: number;
  step?: number;
  target: number;
  /** Accepted absolute distance from target (default 0 = exact). */
  tolerance?: number;
  unit?: string;
  wrongFeedback?: string;
}

/** Fill the missing values in a small two-column table. Correct when every cell matches. */
export interface TableFillSolvable extends BaseSolvable {
  kind: "table-fill";
  /** Column headers, e.g. { x: "x", y: "y" }. */
  columns: { x: string; y: string };
  rows: TableFillRow[];
  /** Accept decimal equivalents within tolerance (mirrors NumericSolvable). */
  acceptDecimal?: boolean;
  wrongFeedback?: string;
}

export type Solvable =
  | ObserveSolvable
  | NumericSolvable
  | ChoiceSolvable
  | GraphTargetSolvable
  | MultiSelectSolvable
  | OrderSolvable
  | SliderSolvable
  | CategorizeSolvable
  | NumberLineSolvable
  | TableFillSolvable;

/** Authoring availability of a lesson (distinct from a user's progress status). */
export type LessonAvailability = "preview" | "playable" | "coming-soon";

export interface Lesson {
  id: string;
  order: number;
  title: string;
  description: string;
  availability: LessonAvailability;
  estimatedMinutes?: number;
  objective?: string;
  keyIdea?: string;
  concepts: ConceptId[];
  /** Empty for non-playable lessons. */
  solvables: Solvable[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  lessons: Lesson[];
}
