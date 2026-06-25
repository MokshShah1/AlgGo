/** Concept IDs tracked for mastery (PRD section 13). */
export type ConceptId =
  | "constant-rate"
  | "rise"
  | "run"
  | "slope-ratio"
  | "positive-slope"
  | "negative-slope"
  | "constant-slope";

export const CONCEPT_IDS: ConceptId[] = [
  "constant-rate",
  "rise",
  "run",
  "slope-ratio",
  "positive-slope",
  "negative-slope",
  "constant-slope",
];

export const CONCEPT_LABELS: Record<ConceptId, string> = {
  "constant-rate": "Constant rate of change",
  rise: "Rise (vertical change)",
  run: "Run (horizontal change)",
  "slope-ratio": "Slope as rise / run",
  "positive-slope": "Positive slope",
  "negative-slope": "Negative slope",
  "constant-slope": "Constant slope along a line",
};
