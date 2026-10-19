import { Hono } from "hono";

import type { AppEnv } from "../../env";
import { allToApi, insertRow, toApi, updateStatement } from "../../lib/db";
import { audit } from "../../lib/audit";
import { HttpError, notFound, parseId } from "../../lib/http";
import { hashPassword } from "../../lib/password";
import { revokeUserSessions } from "../../lib/session";
import { body } from "../../lib/validate";
import { userCreateSchema, userUpdateSchema } from "../../schemas";

export const userRoutes = new Hono<AppEnv>();

const USER_COLUMNS = "id, email, name, role, active, last_login_at, created_at";

userRoutes.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${USER_COLUMNS} FROM users ORDER BY name`,
  ).all();
  return c.json(allToApi(results));
});

userRoutes.post("/", async (c) => {
  const { password, ...input } = await body(c, userCreateSchema);
  const id = await insertRow(c.env.DB, "users", {
    ...input,
    passwordHash: await hashPassword(password),
  });
  await audit(c, "create", "user", id, input);
  const user = await c.env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`)
    .bind(id)
    .first();
  return c.json(toApi(user!), 201);
});

userRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const { password, ...input } = await body(c, userUpdateSchema);
  // An admin locking themselves out would leave nobody able to undo it.
  if (
    id === c.get("user")!.id &&
    ((input.role !== undefined && input.role !== "admin") || input.active === false)
  ) {
    throw new HttpError(400, "Não pode retirar o seu próprio acesso de administrador.");
  }
  const db = c.env.DB;
  const statements = [
    updateStatement(db, "users", id, {
      ...input,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    }),
  ];
  if (password || input.active === false) statements.push(revokeUserSessions(db, id));
  const [update] = await db.batch(statements);
  if (!update!.meta.changes) throw notFound("Utilizador");
  await audit(c, "update", "user", id, { ...input, passwordChanged: Boolean(password) });
  const user = await db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).bind(id).first();
  return c.json(toApi(user!));
});
