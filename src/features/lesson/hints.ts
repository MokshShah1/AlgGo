import type { Solvable } from "@/types/lesson";

/**
 * A progressive hint ladder for a solvable: a gentle nudge first, then a
 * strategy, then the first line of the explanation, and finally the full
 * explanation. Built from already-authored content (no new data needed) so a
 * learner can struggle productively instead of getting one big reveal.
 */
export function getHints(solvable: Solvable): string[] {
  const ladder: string[] = [];

  switch (solvable.kind) {
    case "numeric":
      if (solvable.genericHint) ladder.push(solvable.genericHint);
      break;
    case "choice":
      ladder.push(
        "Rule out the options you're sure are wrong first, then compare what's left."
      );
      break;
    case "graph-target":
      ladder.push(
        "Slope is rise over run. Move point B so the triangle matches the target ratio."
      );
      break;
    case "observe":
      ladder.push("Drag a point and watch how the numbers change.");
      break;
    case "multi-select":
      ladder.push(
        "More than one answer can be right. Check each option on its own - does it fit?"
      );
      break;
    case "order":
      ladder.push(
        "Think about what has to happen first, then build the sequence step by step."
      );
      break;
    case "slider":
      ladder.push(
        "Estimate first, then fine-tune the slider until it matches what the problem asks for."
      );
      break;
    case "categorize":
      ladder.push(
        "Sort one item at a time. Tap an item to move it to the next group, and ask which group truly fits it."
      );
      break;
    case "number-line":
      ladder.push(
        "Find the value first, then drag the marker between the labeled ticks until it lands there."
      );
      break;
    case "table-fill":
      ladder.push(
        "Fill one cell at a time. Use the rule to turn each given value into its missing partner."
      );
      break;
  }

  // A deeper hint: the first sentence of the explanation.
  const sentences = solvable.explanation
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences[0]) ladder.push(sentences[0]);

  // Final tier: the full explanation.
  if (solvable.explanation) ladder.push(solvable.explanation);

  // De-duplicate consecutive/identical tiers.
  return ladder.filter((h, i, all) => h && all.indexOf(h) === i);
}
