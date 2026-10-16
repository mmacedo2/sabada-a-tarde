import { Hono } from "hono";

import type { AppEnv } from "../../env";
import { audit } from "../../lib/audit";
import { allToApi, deleteRow, insertRow, NOW_SQL, toApi, updateStatement } from "../../lib/db";
import { HttpError, notFound, parseId } from "../../lib/http";
import { currentSeasonId, GAME_SELECT, gamesQuery, resolveSeasonId } from "../../lib/queries";
import { body } from "../../lib/validate";
import {
  gameCreateSchema,
  gameEventSchema,
  gameUpdateSchema,
  startedStatuses,
} from "../../schemas";

export const gameRoutes = new Hono<AppEnv>();

type GameRow = {
  id: number;
  homeClubId: number | null;
  awayClubId: number | null;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
};

async function loadGame(db: D1Database, id: number) {
  const row = await db.prepare(`${GAME_SELECT} WHERE g.id = ?`).bind(id).first();
  if (!row) throw notFound("Jogo");
  return toApi<GameRow & Record<string, unknown>>(row);
}

type ScoreFields = {
  status?: string | undefined;
  homeGoals?: number | null | undefined;
  awayGoals?: number | null | undefined;
  homePenalties?: number | null | undefined;
  awayPenalties?: number | null | undefined;
};

const isPlayed = (status: string | undefined) => !!status && startedStatuses.includes(status);

/**
 * A game that kicks off with no score entered starts at 0-0. A game that was not
 * played (scheduled, postponed, cancelled) has no score at all, so moving a game
 * back to one of those states undoes a result entered by mistake.
 */
function normalizeScore<T extends ScoreFields>(input: T, current?: GameRow): T {
  const status = input.status ?? current?.status;
  if (isPlayed(status)) {
    return {
      ...input,
      homeGoals: input.homeGoals ?? current?.homeGoals ?? 0,
      awayGoals: input.awayGoals ?? current?.awayGoals ?? 0,
    };
  }
  return { ...input, homeGoals: null, awayGoals: null, homePenalties: null, awayPenalties: null };
}

gameRoutes.get("/", async (c) => {
  const { results } = await gamesQuery(c.env.DB, {
    seasonId: await resolveSeasonId(c.env.DB, c.req.query("season")),
    competition: c.req.query("competition"),
    club: c.req.query("club"),
    includeHidden: true,
  }).all();
  return c.json(allToApi(results));
});

gameRoutes.get("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const game = await loadGame(c.env.DB, id);
  const { results } = await c.env.DB.prepare(
    `SELECT e.id, e.type, e.minute, e.club_id, e.player_id,
            COALESCE(p.nickname, p.name, e.player_name) AS player_name
       FROM game_events e LEFT JOIN players p ON p.id = e.player_id
      WHERE e.game_id = ? ORDER BY e.minute IS NULL, e.minute, e.id`,
  )
    .bind(id)
    .all();
  return c.json({ ...game, events: allToApi(results) });
});

gameRoutes.post("/", async (c) => {
  const input = normalizeScore(await body(c, gameCreateSchema));
  const id = await insertRow(c.env.DB, "games", {
    ...input,
    seasonId: input.seasonId ?? (await currentSeasonId(c.env.DB)),
  });
  await audit(c, "create", "game", id, input);
  return c.json(await loadGame(c.env.DB, id), 201);
});

gameRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const db = c.env.DB;
  const current = await loadGame(db, id);
  const input = normalizeScore(await body(c, gameUpdateSchema), current);
  const statements = [updateStatement(db, "games", id, input)];
  // Goals and cards of a game that was not played go with its score, in the same transaction.
  const unplayed = !isPlayed(input.status ?? current.status);
  if (unplayed) statements.push(db.prepare("DELETE FROM game_events WHERE game_id = ?").bind(id));
  const results = await db.batch(statements);
  const eventsRemoved = unplayed ? results[1]!.meta.changes : 0;
  await audit(c, "update", "game", id, eventsRemoved ? { ...input, eventsRemoved } : input);
  return c.json(await loadGame(db, id));
});

gameRoutes.delete("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (!(await deleteRow(c.env.DB, "games", id))) throw notFound("Jogo");
  await audit(c, "delete", "game", id);
  return c.body(null, 204);
});

const GOAL_TYPES = new Set(["goal", "penalty_goal", "own_goal"]);

/** Which score column a goal event moves: an own goal counts for the other side. */
function scoringColumn(
  game: GameRow,
  clubId: number,
  type: string,
): "home_goals" | "away_goals" | null {
  if (!GOAL_TYPES.has(type)) return null;
  const forHome = clubId === game.homeClubId;
  return (type === "own_goal" ? !forHome : forHome) ? "home_goals" : "away_goals";
}

gameRoutes.post("/:id/events", async (c) => {
  const id = parseId(c.req.param("id"));
  const input = await body(c, gameEventSchema);
  const game = await loadGame(c.env.DB, id);
  if (!startedStatuses.includes(game.status)) {
    throw new HttpError(409, "Só é possível registar eventos depois do início do jogo.");
  }
  if (input.clubId !== game.homeClubId && input.clubId !== game.awayClubId) {
    throw new HttpError(400, "O clube não participa neste jogo.");
  }

  const db = c.env.DB;
  const column = scoringColumn(game, input.clubId, input.type);
  const statements = [
    db
      .prepare(
        "INSERT INTO game_events (game_id, club_id, player_id, player_name, type, minute) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
      )
      .bind(
        id,
        input.clubId,
        input.playerId ?? null,
        input.playerName ?? null,
        input.type,
        input.minute ?? null,
      ),
  ];
  if (column) {
    statements.push(
      db
        .prepare(`UPDATE games SET ${column} = ${column} + 1, updated_at = ${NOW_SQL} WHERE id = ?`)
        .bind(id),
    );
  }
  const [inserted] = await db.batch<{ id: number }>(statements);
  const eventId = inserted!.results[0]!.id;
  await audit(c, "create", "game_event", eventId, { gameId: id, ...input });
  return c.json(await loadGame(db, id), 201);
});

gameRoutes.delete("/:id/events/:eventId", async (c) => {
  const id = parseId(c.req.param("id"));
  const eventId = parseId(c.req.param("eventId"));
  const db = c.env.DB;
  const game = await loadGame(db, id);
  const event = await db
    .prepare("SELECT club_id, type FROM game_events WHERE id = ? AND game_id = ?")
    .bind(eventId, id)
    .first<{ club_id: number; type: string }>();
  if (!event) throw notFound("Evento");

  const column = scoringColumn(game, event.club_id, event.type);
  const statements = [db.prepare("DELETE FROM game_events WHERE id = ?").bind(eventId)];
  if (column) {
    statements.push(
      db
        .prepare(
          `UPDATE games SET ${column} = MAX(${column} - 1, 0), updated_at = ${NOW_SQL} WHERE id = ?`,
        )
        .bind(id),
    );
  }
  await db.batch(statements);
  await audit(c, "delete", "game_event", eventId, { gameId: id });
  return c.json(await loadGame(db, id));
});
