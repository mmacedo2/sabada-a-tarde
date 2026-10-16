import { describe, expect, it } from "vitest";

import { computeStandings } from "../src/lib/standings";

const game = (
  home: string,
  away: string,
  homeGoals: number | null,
  awayGoals: number | null,
  status = "finished",
) => ({
  home,
  away,
  homeGoals,
  awayGoals,
  status,
});

describe("computeStandings", () => {
  it("orders by points, goal difference, goals scored, then name", () => {
    const table = computeStandings([
      game("a", "b", 2, 0),
      game("c", "d", 3, 1),
      game("b", "d", 1, 1),
      game("a", "c", 0, 0, "live"),
    ]);
    // a and c are both +2 (c scored more); b and d are both -2 (d scored more).
    expect(table.map((r) => [r.club, r.points])).toEqual([
      ["c", 3],
      ["a", 3],
      ["d", 1],
      ["b", 1],
    ]);
  });

  it("lists clubs with only scheduled games and ignores undecided ties", () => {
    const table = computeStandings([
      game("a", "b", null, null, "scheduled"),
      { home: null, away: "a", homeGoals: null, awayGoals: null, status: "scheduled" },
    ]);
    expect(table).toHaveLength(2);
    expect(table.every((r) => r.played === 0)).toBe(true);
  });
});
