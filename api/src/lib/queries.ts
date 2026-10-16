import { HttpError } from "./http";

/** Shared SELECT for games: ids plus the slugs the frontend links with. */
export const GAME_SELECT = `
  SELECT g.id, g.season_id, g.competition_id, co.slug AS competition, g.round, g.stage,
         g.home_club_id, hc.slug AS home, g.home_placeholder,
         g.away_club_id, ac.slug AS away, g.away_placeholder,
         g.date, g.kickoff_time, g.venue, g.status,
         g.home_goals, g.away_goals, g.home_penalties, g.away_penalties,
         g.notes, g.visible, g.updated_at
    FROM games g
    JOIN competitions co ON co.id = g.competition_id
    LEFT JOIN clubs hc ON hc.id = g.home_club_id
    LEFT JOIN clubs ac ON ac.id = g.away_club_id`;

export async function currentSeasonId(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT id FROM seasons WHERE is_current = 1")
    .first<{ id: number }>();
  if (!row) throw new HttpError(409, "Não existe uma época atual definida.");
  return row.id;
}

/** `season` query param: a season id, or absent/"current" for the current season. */
export async function resolveSeasonId(db: D1Database, raw: string | undefined): Promise<number> {
  if (raw === undefined || raw === "current") return currentSeasonId(db);
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(400, "Época inválida.");
  return id;
}

export type GameFilters = {
  seasonId: number;
  competition?: string | undefined;
  club?: string | undefined;
  status?: string[] | undefined;
  includeHidden?: boolean;
};

export function gamesQuery(db: D1Database, f: GameFilters): D1PreparedStatement {
  const where = ["g.season_id = ?"];
  const params: unknown[] = [f.seasonId];
  if (!f.includeHidden) where.push("g.visible = 1");
  if (f.competition) {
    where.push("co.slug = ?");
    params.push(f.competition);
  }
  if (f.club) {
    where.push("(hc.slug = ? OR ac.slug = ?)");
    params.push(f.club, f.club);
  }
  if (f.status?.length) {
    where.push(`g.status IN (${f.status.map(() => "?").join(", ")})`);
    params.push(...f.status);
  }
  return db
    .prepare(`${GAME_SELECT} WHERE ${where.join(" AND ")} ORDER BY g.date, g.kickoff_time, g.id`)
    .bind(...params);
}
