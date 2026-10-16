import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import type { AppEnv, SessionUser } from "../env";

export const SESSION_COOKIE = "sat_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const cookieOptions = (c: Context<AppEnv>) =>
  ({
    httpOnly: true,
    secure: c.env.COOKIE_SECURE !== "false",
    sameSite: "Lax",
    path: "/api",
  }) as const;

export async function startSession(c: Context<AppEnv>, userId: number): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await c.env.DB.prepare(
    "INSERT INTO sessions (id, user_id, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(
      await sha256Hex(token),
      userId,
      expiresAt,
      c.req.header("cf-connecting-ip") ?? null,
      c.req.header("user-agent")?.slice(0, 255) ?? null,
    )
    .run();
  setCookie(c, SESSION_COOKIE, token, { ...cookieOptions(c), maxAge: SESSION_TTL_SECONDS });
}

export async function readSession(
  c: Context<AppEnv>,
): Promise<{ user: SessionUser; sessionId: string } | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  const sessionId = await sha256Hex(token);
  const user = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ? AND u.active = 1`,
  )
    .bind(sessionId, new Date().toISOString())
    .first<SessionUser>();
  return user ? { user, sessionId } : null;
}

export async function endSession(c: Context<AppEnv>): Promise<void> {
  const sessionId = c.get("sessionId");
  if (sessionId) await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
  deleteCookie(c, SESSION_COOKIE, cookieOptions(c));
}

/** Signs a user out everywhere, optionally keeping the session making the request. */
export function revokeUserSessions(
  db: D1Database,
  userId: number,
  keepSessionId: string | null = null,
): D1PreparedStatement {
  return db
    .prepare("DELETE FROM sessions WHERE user_id = ? AND id IS NOT ?")
    .bind(userId, keepSessionId);
}
