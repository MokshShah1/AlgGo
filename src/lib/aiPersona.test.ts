import { describe, expect, it } from "vitest";
import { rivalStandings } from "@/lib/aiPersona";

describe("AI rival standings", () => {
  it("never reports more weekly XP than all-time XP", () => {
    const cases: [number, number][] = [
      [0, 0],
      [300, 200],
      [1000, 50],
      [120, 120],
      [50, 0],
    ];
    for (const [total, weekly] of cases) {
      const { all, week } = rivalStandings(total, weekly);
      expect(week.xp).toBeLessThanOrEqual(all.xp);
      expect(week.xp).toBeGreaterThanOrEqual(0);
      expect(all.xp).toBeGreaterThanOrEqual(0);
    }
  });
});
