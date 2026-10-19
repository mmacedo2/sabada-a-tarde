import { Hono } from "hono";

import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { NOW_SQL } from "../lib/db";
import { HttpError } from "../lib/http";
import { requireUser } from "../lib/middleware";
import { oidcConfig } from "../lib/oidc";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "../lib/password";
import { endSession, revokeUserSessions, startSession } from "../lib/session";
import { body } from "../lib/validate";
import { changePasswordSchema, loginSchema, registerSchema } from "../schemas";
import { oidcRoutes } from "./oidc";

export const authRoutes = new Hono<AppEnv>();

const THROTTLE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 30;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000;
const MAX_SIGNUPS_PER_IP = 5;

authRoutes.use(async (c, next) => {
  await next();
  c.header("Cache-Control", "no-store");
});

authRoutes.post("/login", async (c) => {
  const { email, password } = await body(c, loginSchema);
  const ip = c.req.header("cf-connecting-ip") ?? null;
  const db = c.env.DB;
  const since = new Date(Date.now() - THROTTLE_WINDOW_MS).toISOString();

  const [byEmail, byIp] = await db.batch<{ n: number }>([
    db
      .prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE email = ? AND attempted_at > ?")
      .bind(email, since),
    db
      .prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND attempted_at > ?")
      .bind(ip, since),
  ]);
  if (
    (byEmail!.results[0]?.n ?? 0) >= MAX_FAILURES_PER_EMAIL ||
    (byIp!.results[0]?.n ?? 0) >= MAX_FAILURES_PER_IP
  ) {
    throw new HttpError(
      429,
      "Demasiadas tentativas falhadas. Tente novamente dentro de 15 minutos.",
    );
  }

  const user = await db
    .prepare("SELECT id, email, name, role, password_hash, active FROM users WHERE email = ?")
    .bind(email)
    .first<{
      id: number;
      email: string;
      name: string;
      role: string;
      password_hash: string;
      active: number;
    }>();
  const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_PASSWORD_HASH);

  if (!user || !valid || user.active !== 1) {
    await db.batch([
      db.prepare("INSERT INTO login_attempts (email, ip) VALUES (?, ?)").bind(email, ip),
      db
        .prepare("DELETE FROM login_attempts WHERE attempted_at < ?")
        .bind(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);
    throw new HttpError(401, "Email ou palavra-passe incorretos.");
  }

  await db.batch([
    db.prepare("DELETE FROM login_attempts WHERE email = ?").bind(email),
    db.prepare(`UPDATE users SET last_login_at = ${NOW_SQL} WHERE id = ?`).bind(user.id),
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(new Date().toISOString()),
  ]);
  await startSession(c, user.id);
  return c.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

/**
 * Creates a `user` account and signs it in. Nobody checks the email, so the account is
 * marked unverified: an OIDC sign-in with the same verified email takes it over.
 */
authRoutes.post("/register", async (c) => {
  const { email, name, password } = await body(c, registerSchema);
  const ip = c.req.header("cf-connecting-ip") ?? null;
  const db = c.env.DB;
  const since = new Date(Date.now() - SIGNUP_WINDOW_MS).toISOString();

  const attempts = await db
    .prepare("SELECT COUNT(*) AS n FROM signup_attempts WHERE ip = ? AND attempted_at > ?")
    .bind(ip, since)
    .first<{ n: number }>();
  if ((attempts?.n ?? 0) >= MAX_SIGNUPS_PER_IP) {
    throw new HttpError(429, "Demasiados registos a partir desta rede. Tente mais tarde.");
  }
  await db.batch([
    db.prepare("INSERT INTO signup_attempts (ip) VALUES (?)").bind(ip),
    db
      .prepare("DELETE FROM signup_attempts WHERE attempted_at < ?")
      .bind(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const taken = await db.prepare("SELECT 1 FROM users WHERE email = ?").bind(email).first();
  if (taken) {
    throw new HttpError(409, "Já existe uma conta com este email. Inicie sessão.");
  }
  const user = await db
    .prepare(
      `INSERT INTO users (email, name, password_hash, role, email_verified)
       VALUES (?, ?, ?, 'user', 0) RETURNING id, email, name, role`,
    )
    .bind(email, name, await hashPassword(password))
    .first<{ id: number; email: string; name: string; role: string }>();
  await audit(c, "create", "user", user!.id, { email, name, via: "register" });
  await startSession(c, user!.id);
  return c.json(user, 201);
});

authRoutes.post("/logout", async (c) => {
  await endSession(c);
  return c.body(null, 204);
});

authRoutes.get("/me", (c) => c.json(c.get("user")));

/** What the login page offers besides email and password. */
authRoutes.get("/providers", (c) => {
  const config = oidcConfig(c.env);
  return c.json({ oidc: config ? { name: config.name } : null });
});

authRoutes.route("/oidc", oidcRoutes);

authRoutes.post("/password", requireUser, async (c) => {
  const { currentPassword, newPassword } = await body(c, changePasswordSchema);
  const user = c.get("user")!;
  const row = await c.env.DB.prepare("SELECT password_hash FROM users WHERE id = ?")
    .bind(user.id)
    .first<{ password_hash: string }>();
  if (!row || !(await verifyPassword(currentPassword, row.password_hash))) {
    throw new HttpError(400, "A palavra-passe atual está incorreta.");
  }
  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE users SET password_hash = ?, updated_at = ${NOW_SQL} WHERE id = ?`,
    ).bind(await hashPassword(newPassword), user.id),
    revokeUserSessions(c.env.DB, user.id, c.get("sessionId")),
  ]);
  return c.body(null, 204);
});
