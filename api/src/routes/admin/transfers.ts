import { Hono } from "hono";

import type { AppEnv } from "../../env";
import { audit } from "../../lib/audit";
import { allToApi, NOW_SQL } from "../../lib/db";
import { notFound, parseId } from "../../lib/http";
import { body } from "../../lib/validate";
import { transferSchema } from "../../schemas";

export const transferRoutes = new Hono<AppEnv>();

/** A player's club follows their most recent transfer. */
const syncPlayerClub = (db: D1Database, playerId: number) =>
  db
    .prepare(
      `UPDATE players
          SET club_id = (SELECT to_club_id FROM transfers WHERE player_id = ?1 ORDER BY date DESC, id DESC LIMIT 1),
              updated_at = ${NOW_SQL}
        WHERE id = ?1 AND EXISTS (SELECT 1 FROM transfers WHERE player_id = ?1)`,
    )
    .bind(playerId);

transferRoutes.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT t.*, p.name AS player_name FROM transfers t JOIN players p ON p.id = t.player_id
      ORDER BY t.date DESC, t.id DESC LIMIT 500`,
  ).all();
  return c.json(allToApi(results));
});

transferRoutes.post("/", async (c) => {
  const input = await body(c, transferSchema);
  const db = c.env.DB;
  const [inserted] = await db.batch<{ id: number }>([
    db
      .prepare(
        `INSERT INTO transfers (player_id, from_club_id, to_club_id, date, notes, visible)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      )
      .bind(
        input.playerId,
        input.fromClubId ?? null,
        input.toClubId ?? null,
        input.date,
        input.notes ?? null,
        Number(input.visible),
      ),
    syncPlayerClub(db, input.playerId),
  ]);
  const id = inserted!.results[0]!.id;
  await audit(c, "create", "transfer", id, input);
  return c.json({ id }, 201);
});

transferRoutes.delete("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const db = c.env.DB;
  const transfer = await db
    .prepare("SELECT player_id FROM transfers WHERE id = ?")
    .bind(id)
    .first<{ player_id: number }>();
  if (!transfer) throw notFound("Transferência");
  await db.batch([
    db.prepare("DELETE FROM transfers WHERE id = ?").bind(id),
    syncPlayerClub(db, transfer.player_id),
  ]);
  await audit(c, "delete", "transfer", id);
  return c.body(null, 204);
});
