import type { GraphConfig } from "@/types/lesson";

/** Builds a GraphConfig with sensible defaults, overridable per solvable. */
export function makeGraph(overrides: Partial<GraphConfig> = {}): GraphConfig {
  return {
    xMin: -1,
    xMax: 7,
    yMin: -1,
    yMax: 7,
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
