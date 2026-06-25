---
name: authoring-lessons
description: Author new interactive math lessons for this app in src/content following the typed Lesson/Solvable contract, then register them in course.ts. Use when the user asks to add, create, or edit a lesson, solvable, step, or course content for the linear-relationships course.
disable-model-invocation: true
---

# Authoring Lessons

Lessons are typed TypeScript data, not free-form prose. Each lives in its own
file in `src/content/`, exports a single `Lesson` object, and is registered in
`src/content/course.ts`. The lesson player renders everything from this data and
the validator (`src/features/lesson/validate.ts`) grades answers from it, so the
shape must match `src/types/lesson.ts` exactly.

## Workflow

```
- [ ] 1. Read an existing lesson as a template (src/content/slopeRiseRun.ts is the reference)
- [ ] 2. Create src/content/<lessonName>.ts exporting one `Lesson`
- [ ] 3. Author solvables (see "Solvable kinds" below)
- [ ] 4. Register the lesson in src/content/course.ts (import + add to `lessons`)
- [ ] 5. Type-check with `npx tsc -p tsconfig.app.json --noEmit`
```

## Lesson object

Match the `Lesson` interface in `src/types/lesson.ts`:

- `id`: kebab-case, unique, matches the variable name theme (e.g. `"slope-rise-run"`).
- `order`: integer position in the course. Must be unique; `getNextLesson` walks `order + 1`.
- `title`, `description`: learner-facing copy.
- `availability`: `"playable"` for finished lessons; `"preview"` or `"coming-soon"` otherwise.
- `concepts`: array of `ConceptId` — see "Concepts" below. The union of every solvable's concepts.
- `solvables`: ordered steps. Aim for ~10. Later steps are treated as harder unless you set `difficulty`.
- Optional: `estimatedMinutes`, `objective`, `keyIdea`.

Export with a descriptive const name and a `Lesson` annotation:

```ts
export const myLessonNameLesson: Lesson = { /* ... */ };
```

## The `graph()` helper pattern

When several solvables share a coordinate plane, define a local `graph()` helper
and a `BOUNDS` constant at the top of the file (copy from `slopeRiseRun.ts`). It
spreads sensible defaults so each solvable only overrides what changes:

```ts
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
```

Set `preventVertical: true` on any draggable graph so dragging can never produce
run = 0 (divide-by-zero). `GraphConfig` is only needed for steps that show a plane.

## Solvable kinds

Every solvable shares `id`, `kind`, `prompt`, `concepts`, `correctFeedback`,
`explanation`. The `id` is unique within the lesson (used as the attempt key).
Pick the kind by interaction type:

### `observe` — drag to build intuition (no wrong answer)
Required: `graph` (with `draggable` set), `minInteractions`. Correct once the
learner drags `>= minInteractions` times.

### `numeric` — typed number or fraction
Required: `acceptedAnswers` (canonical strings like `["2"]` or `["2/3"]`),
`wrongFeedback` (array of `{ match, feedback, misconceptionTag? }`), `genericHint`.
Optional: `graph`, `acceptDecimal`, `placeholder`.
- `acceptedAnswers` and each `wrongFeedback.match` are run through `normalizeAnswer`,
  which reduces fractions and strips whitespace. So `"4/-2"`, `"-2/1"`, and `"-2"`
  all collapse to `"-2"` — write the **reduced** form and don't author two rules
  that normalize to the same value.
- Set `acceptDecimal: true` to accept decimals within ±0.02 of an accepted value
  (use for fraction answers like `2/3`). Otherwise matching is exact.
- A wrong answer with no matching rule falls back to `genericHint`.

### `choice` — multiple choice / tiles
Required: `options` (`{ id, label }[]`), `correctOptionId`, `wrongFeedback`
(a `Record<optionId, { feedback, misconceptionTag? }>` — note this is an object
keyed by option id, NOT an array like `numeric`). Optional: `graph`,
`variant: "tiles" | "list"`. Every distractor should have a `wrongFeedback` entry.

### `graph-target` — drag point B to hit a target slope
Required: `graph` (draggable, usually `preventVertical: true`), `targetSlope`
(`{ rise, run }` as integers; equivalent ratios are accepted), and a `feedback`
object with all four keys: `swapped`, `negative`, `verticalRun0`, `generic`. The
validator picks which message to show based on the learner's dragged ratio.

## Concepts

`concepts` values MUST come from the `ConceptId` union in `src/types/concepts.ts`:
`constant-rate`, `rise`, `run`, `slope-ratio`, `positive-slope`, `negative-slope`,
`constant-slope`. Do not invent new concept ids without first adding them to
`concepts.ts` (and `CONCEPT_IDS` + `CONCEPT_LABELS`). `misconceptionTag` values are
free-form strings — reuse existing tags (e.g. `rise-run-swap`, `order-swap`,
`dropped-sign`, `add-not-divide`, `slope-vs-intercept`) for consistent analytics.

## Register the lesson

A lesson is invisible until added to `src/content/course.ts`:

```ts
import { myLessonNameLesson } from "@/content/myLessonName";

export const course: Course = {
  // ...
  lessons: [
    // ...existing lessons in order...
    myLessonNameLesson,
  ],
};
```

Keep the array ordered by each lesson's `order` field.

## Authoring guidance

- Use the `@/` import alias (e.g. `import type { Lesson } from "@/types/lesson"`).
- Write specific, encouraging feedback that names the misconception; copy the tone
  of `slopeRiseRun.ts`. Avoid generic "Wrong, try again."
- Ramp difficulty: early steps `observe`/single-concept `numeric`, later steps
  multi-concept `choice`/`graph-target`.
- Validate types when done: `npx tsc -p tsconfig.app.json --noEmit`.
