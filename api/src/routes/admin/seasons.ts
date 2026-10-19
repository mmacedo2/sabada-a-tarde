import { Hono } from "hono";

import type { AppEnv } from "../../env";
import { audit } from "../../lib/audit";
import { allToApi, deleteRow, insertRow, toApi, updateStatement } from "../../lib/db";
import { notFound, parseId } from "../../lib/http";
import { body } from "../../lib/validate";
import { seasonSchema, seasonUpdateSchema } from "../../schemas";

export const seasonRoutes = new Hono<AppEnv>();

const clearCurrent = (db: D1Database, exceptId: number) =>
  db.prepare("UPDATE seasons SET is_current = 0 WHERE is_current = 1 AND id <> ?").bind(exceptId);

const byId = (db: D1Database, id: number) =>
  db.prepare("SELECT * FROM seasons WHERE id = ?").bind(id).first();

seasonRoutes.get("/", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM seasons ORDER BY starts_on DESC").all();
  return c.json(allToApi(results));
});

seasonRoutes.post("/", async (c) => {
  const { isCurrent, ...input } = await body(c, seasonSchema);
  const db = c.env.DB;
  const id = await insertRow(db, "seasons", input);
  // Only one season can be current (enforced by a unique index), so switch in one transaction.
  if (isCurrent)
    await db.batch([clearCurrent(db, id), updateStatement(db, "seasons", id, { isCurrent })]);
  await audit(c, "create", "season", id, { ...input, isCurrent });
  return c.json(toApi((await byId(db, id))!), 201);
});

seasonRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const input = await body(c, seasonUpdateSchema);
  const db = c.env.DB;
  const statements = [updateStatement(db, "seasons", id, input)];
  if (input.isCurrent) statements.unshift(clearCurrent(db, id));
  const results = await db.batch(statements);
  if (!results.at(-1)!.meta.changes) throw notFound("Época");
  await audit(c, "update", "season", id, input);
  return c.json(toApi((await byId(db, id))!));
});

seasonRoutes.delete("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (!(await deleteRow(c.env.DB, "seasons", id))) throw notFound("Época");
  await audit(c, "delete", "season", id);
  return c.body(null, 204);
});
