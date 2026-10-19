import { Hono, type Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";

import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { NOW_SQL } from "../lib/db";
import { HttpError } from "../lib/http";
import { authorizationUrl, fetchIdentity, oidcConfig, type OidcIdentity } from "../lib/oidc";
import { NO_PASSWORD } from "../lib/password";
import { randomToken, revokeUserSessions, startSession } from "../lib/session";

/**
 * "Entrar com <provider>": signs in, links an existing account by verified email,
 * or registers a new one with the `user` role. Manager and admin rights are only
 * ever granted by an admin in /admin/utilizadores.
 */
export const oidcRoutes = new Hono<AppEnv>();

const STATE_COOKIE = "sat_oidc";
const STATE_TTL_SECONDS = 10 * 60;

const stateCookieOptions = (c: Context<AppEnv>) =>
  ({
    httpOnly: true,
    secure: c.env.COOKIE_SECURE !== "false",
    // Lax still reaches the callback: the provider sends the browser back with a top-level GET.
    sameSite: "Lax",
    path: "/api/auth/oidc",
  }) as const;

const savedStateSchema = z.object({
  state: z.string().min(1),
  verifier: z.string().min(1),
  redirect: z.string(),
});

/** Same rule as the login page: only internal admin paths, so it cannot leave the site. */
const safeRedirect = (value: unknown) =>
  typeof value === "string" && /^\/admin(\/[\w\-/]*)?$/.test(value) ? value : "/admin";

/** Where a role lands after signing in; managers only have the games screens. */
function landing(role: string, redirect: string): string {
  if (role === "admin") return redirect;
  if (role === "manager") return /^\/admin\/jogos(\/|$)/.test(redirect) ? redirect : "/admin/jogos";
  return "/";
}

const callbackUrl = (c: Context<AppEnv>) => `${new URL(c.req.url).origin}/api/auth/oidc/callback`;

/** Back to the login page, which explains the code. */
const fail = (c: Context<AppEnv>, code: string) =>
  c.redirect(`/entrar?erro=${encodeURIComponent(code)}`, 302);

function requireConfig(c: Context<AppEnv>) {
  const config = oidcConfig(c.env);
  if (!config) throw new HttpError(404, "Início de sessão externo não está configurado.");
  return config;
}

oidcRoutes.get("/start", async (c) => {
  const config = requireConfig(c);
  const state = randomToken();
  const verifier = randomToken();
  let url: string;
  try {
    url = await authorizationUrl(config, callbackUrl(c), state, verifier);
  } catch (error) {
    console.error("OIDC start failed", { issuer: config.issuer, error });
    return fail(c, "oidc");
  }
  const saved = { state, verifier, redirect: safeRedirect(c.req.query("redirect")) };
  setCookie(c, STATE_COOKIE, JSON.stringify(saved), {
    ...stateCookieOptions(c),
    maxAge: STATE_TTL_SECONDS,
  });
  return c.redirect(url, 302);
});

type AccountRow = { id: number; role: string; active: number };

async function findOrCreateUser(
  c: Context<AppEnv>,
  identity: OidcIdentity,
): Promise<AccountRow | null> {
  const db = c.env.DB;
  const linked = await db
    .prepare(
      `SELECT u.id, u.role, u.active FROM user_identities i JOIN users u ON u.id = i.user_id
        WHERE i.issuer = ? AND i.subject = ?`,
    )
    .bind(identity.issuer, identity.subject)
    .first<AccountRow>();
  if (linked) return linked;
  // Linking or registering by email is only safe when the provider verified it.
  if (!identity.email) return null;

  const link = db
    .prepare(
      "INSERT INTO user_identities (user_id, issuer, subject) SELECT id, ?, ? FROM users WHERE email = ?",
    )
    .bind(identity.issuer, identity.subject, identity.email);
  const existing = await db
    .prepare("SELECT id, role, active, email_verified FROM users WHERE email = ?")
    .bind(identity.email)
    .first<AccountRow & { email_verified: number }>();
  if (existing?.email_verified === 1) {
    await link.run();
    return existing;
  }
  if (existing) {
    // Self-registered, so nobody had proven the email; the provider just did. Whoever
    // registered may not be the owner, so their password and sessions stop working.
    await db.batch([
      link,
      db
        .prepare(
          `UPDATE users SET email_verified = 1, password_hash = ?, updated_at = ${NOW_SQL} WHERE id = ?`,
        )
        .bind(NO_PASSWORD, existing.id),
      revokeUserSessions(db, existing.id),
    ]);
    await audit(c, "update", "user", existing.id, { claimedVia: "oidc", passwordCleared: true });
    return existing;
  }

  const name = identity.name ?? identity.email.split("@")[0]!;
  const [created] = await db.batch<AccountRow>([
    db
      .prepare(
        "INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'user') RETURNING id, role, active",
      )
      .bind(identity.email, name, NO_PASSWORD),
    link,
  ]);
  const user = created!.results[0]!;
  await audit(c, "create", "user", user.id, { email: identity.email, name, via: "oidc" });
  return user;
}

oidcRoutes.get("/callback", async (c) => {
  const config = requireConfig(c);
  const raw = getCookie(c, STATE_COOKIE);
  deleteCookie(c, STATE_COOKIE, stateCookieOptions(c));

  const providerError = c.req.query("error");
  if (providerError) {
    if (providerError === "access_denied") return fail(c, "cancelado");
    console.error("OIDC provider returned an error", {
      error: providerError,
      description: c.req.query("error_description"),
    });
    return fail(c, "oidc");
  }

  let saved: z.infer<typeof savedStateSchema> | null = null;
  try {
    saved = raw ? savedStateSchema.parse(JSON.parse(raw)) : null;
  } catch {
    saved = null;
  }
  const code = c.req.query("code");
  // Expired, or a callback this browser did not start (login CSRF).
  if (!saved || !code || c.req.query("state") !== saved.state) return fail(c, "sessao");

  let user: AccountRow | null;
  try {
    const identity = await fetchIdentity(config, callbackUrl(c), code, saved.verifier);
    user = await findOrCreateUser(c, identity);
  } catch (error) {
    console.error("OIDC callback failed", { issuer: config.issuer, error });
    return fail(c, "oidc");
  }
  if (!user) return fail(c, "email");
  if (user.active !== 1) return fail(c, "inativo");

  await c.env.DB.prepare(`UPDATE users SET last_login_at = ${NOW_SQL} WHERE id = ?`)
    .bind(user.id)
    .run();
  await startSession(c, user.id);
  return c.redirect(landing(user.role, saved.redirect), 302);
});
