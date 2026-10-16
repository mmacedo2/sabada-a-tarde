import { Hono } from "hono";
import type { z } from "zod";

import type { AppEnv } from "../../env";
import { audit } from "../../lib/audit";
import { allToApi, deleteRow, insertRow, toApi, updateRow } from "../../lib/db";
import { notFound, parseId } from "../../lib/http";
import { body } from "../../lib/validate";

type Resource = {
  table: string;
  entity: string;
  label: string;
  orderBy: string;
  create: z.ZodTypeAny;
  update: z.ZodTypeAny;
};

/**
 * List/create/update/delete for reference tables whose writes need no side
 * effects (clubs, competitions, players, documents). Tables with side effects
 * (games, seasons, transfers, articles, users) have their own routes.
 */
export function crudRoutes(r: Resource) {
  const app = new Hono<AppEnv>();
  const byId = (db: D1Database, id: number) =>
    db.prepare(`SELECT * FROM ${r.table} WHERE id = ?`).bind(id).first();

  app.get("/", async (c) => {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM ${r.table} ORDER BY ${r.orderBy}`,
    ).all();
    return c.json(allToApi(results));
  });

  app.post("/", async (c) => {
    const input = await body(c, r.create);
    const id = await insertRow(c.env.DB, r.table, input);
    await audit(c, "create", r.entity, id, input);
    return c.json(toApi((await byId(c.env.DB, id))!), 201);
  });

  app.patch("/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    const input = await body(c, r.update);
    if (!(await updateRow(c.env.DB, r.table, id, input))) throw notFound(r.label);
    await audit(c, "update", r.entity, id, input);
    return c.json(toApi((await byId(c.env.DB, id))!));
  });

  app.delete("/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    if (!(await deleteRow(c.env.DB, r.table, id))) throw notFound(r.label);
    await audit(c, "delete", r.entity, id);
    return c.body(null, 204);
  });

  return app;
}
