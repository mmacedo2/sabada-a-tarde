import { createMiddleware } from "hono/factory";

import type { AppEnv } from "../env";
import { HttpError } from "./http";
import { readSession } from "./session";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Cookies are SameSite=Lax and the API never grants CORS, but state-changing
 * requests must also come from a page on this same host.
 */
export const sameOriginWrites = createMiddleware<AppEnv>(async (c, next) => {
  if (!SAFE_METHODS.has(c.req.method)) {
    const origin = c.req.header("origin");
    const host = c.req.header("host");
    let originHost: string | null = null;
    try {
      originHost = origin ? new URL(origin).host : null;
    } catch {
      originHost = null;
    }
    if (!originHost || originHost !== host) {
      throw new HttpError(403, "Pedido de outra origem recusado.");
    }
  }
  await next();
});

export const loadSession = createMiddleware<AppEnv>(async (c, next) => {
  const session = await readSession(c);
  c.set("user", session?.user ?? null);
  c.set("sessionId", session?.sessionId ?? null);
  await next();
});

export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("user")) throw new HttpError(401, "Sessão expirada. Inicie sessão novamente.");
  await next();
});

const MANAGER_READS = new Set(["/clubs", "/competitions", "/seasons"]);

/**
 * What a manager may do under /api/admin: everything on games except deleting one,
 * and reading the lists the game form needs. Anything not listed is admin-only.
 */
export function managerMay(method: string, adminPath: string): boolean {
  if (adminPath === "/games" || adminPath.startsWith("/games/")) {
    return !(method === "DELETE" && /^\/games\/\d+$/.test(adminPath));
  }
  return method === "GET" && MANAGER_READS.has(adminPath);
}

/** Guards /api/admin: admins everywhere, managers where managerMay allows. */
export const requireStaff = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get("user");
  if (!user) throw new HttpError(401, "Sessão expirada. Inicie sessão novamente.");
  const adminPath = c.req.path.replace(/^\/api\/admin/, "");
  const allowed =
    user.role === "admin" || (user.role === "manager" && managerMay(c.req.method, adminPath));
  if (!allowed) throw new HttpError(403, "Sem permissão para esta ação.");
  await next();
});
