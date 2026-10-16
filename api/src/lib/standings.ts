export type StandingRow = {
  position: number;
  club: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export type StandingsGame = {
  home: string | null;
  away: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  status: string;
};

const POINTS = { win: 3, draw: 1 } as const;

/**
 * League table from finished games. Every club that appears in a fixture is
 * listed, so the table exists from round one. Ties break on goal difference,
 * then goals scored, then slug for a stable order.
 */
export function computeStandings(games: StandingsGame[]): StandingRow[] {
  const table = new Map<string, StandingRow>();
  const row = (club: string) => {
    let r = table.get(club);
    if (!r) {
      r = {
        position: 0,
        club,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      };
      table.set(club, r);
    }
    return r;
  };

  for (const g of games) {
    if (!g.home || !g.away) continue;
    const home = row(g.home);
    const away = row(g.away);
    if (g.status !== "finished" || g.homeGoals == null || g.awayGoals == null) continue;

    home.played++;
    away.played++;
    home.goalsFor += g.homeGoals;
    home.goalsAgainst += g.awayGoals;
    away.goalsFor += g.awayGoals;
    away.goalsAgainst += g.homeGoals;
    if (g.homeGoals > g.awayGoals) {
      home.wins++;
      away.losses++;
      home.points += POINTS.win;
    } else if (g.homeGoals < g.awayGoals) {
      away.wins++;
      home.losses++;
      away.points += POINTS.win;
    } else {
      home.draws++;
      away.draws++;
      home.points += POINTS.draw;
      away.points += POINTS.draw;
    }
  }

  return [...table.values()]
    .sort(
      (x, y) =>
        y.points - x.points ||
        y.goalsFor - y.goalsAgainst - (x.goalsFor - x.goalsAgainst) ||
        y.goalsFor - x.goalsFor ||
        x.club.localeCompare(y.club),
    )
    .map((r, i) => ({ ...r, position: i + 1 }));
}
