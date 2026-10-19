import { Hono } from "hono";

import type { AppEnv } from "../../env";
import { allToApi } from "../../lib/db";

export const auditRoutes = new Hono<AppEnv>();

auditRoutes.get("/", async (c) => {
  const limit = Math.min(Math.max(Number(c.req.query("limit")) || 100, 1), 500);
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.action, a.entity, a.entity_id, a.details, a.created_at, u.name AS user_name
       FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC, a.id DESC LIMIT ?`,
  )
    .bind(limit)
    .all();
  return c.json(allToApi(results));
});
