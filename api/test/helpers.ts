import { env } from "cloudflare:workers";

import type { Role } from "../src/env";
import app from "../src/index";
import { hashPassword } from "../src/lib/password";

export const ORIGIN = "http://localhost";

export async function createUser(
  email: string,
  role: Role = "admin",
  password = "correct-horse-battery",
): Promise<number> {
  const row = await env.DB.prepare(
    "INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?) RETURNING id",
  )
    .bind(email, email.split("@")[0], await hashPassword(password), role)
    .first<{ id: number }>();
  return row!.id;
}

/** A minimal browser: same-origin requests that keep the session cookie. */
export class Client {
  cookie = "";

  async request(
    path: string,
    init: {
      method?: string;
      json?: unknown;
      body?: BodyInit;
      headers?: Record<string, string>;
    } = {},
  ) {
    const headers: Record<string, string> = { origin: ORIGIN, host: "localhost", ...init.headers };
    if (this.cookie) headers.cookie = this.cookie;
    let body = init.body;
    if (init.json !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(init.json);
    }
    const res = await app.request(
      `${ORIGIN}${path}`,
      { method: init.method ?? "GET", headers, body },
      env,
    );
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";")[0]!;
    return res;
  }

  async login(email: string, password = "correct-horse-battery") {
    return this.request("/api/auth/login", { method: "POST", json: { email, password } });
  }
}

export async function adminClient(
  email = `admin-${crypto.randomUUID()}@test.pt`,
  role: Role = "admin",
) {
  await createUser(email, role);
  const client = new Client();
  const res = await client.login(email);
  if (res.status !== 200) throw new Error(`login failed: ${res.status}`);
  return client;
}

/** Season, two competitions and three clubs; returns their ids. */
export async function seedReference() {
  const db = env.DB;
  const one = async (sql: string, ...params: unknown[]) =>
    (await db
      .prepare(`${sql} RETURNING id`)
      .bind(...params)
      .first<{ id: number }>())!.id;
  const tag = crypto.randomUUID().slice(0, 8);
  await db.prepare("UPDATE seasons SET is_current = 0").run();
  return {
    season: await one(
      "INSERT INTO seasons (name, starts_on, ends_on, is_current) VALUES (?, '2026-09-01', '2027-06-30', 1)",
      `S-${tag}`,
    ),
    league: await one(
      "INSERT INTO competitions (slug, name, kind) VALUES (?, 'Liga', 'league')",
      `liga-${tag}`,
    ),
    leagueSlug: `liga-${tag}`,
    home: await one(
      "INSERT INTO clubs (slug, name, short_name) VALUES (?, 'Casa', 'Casa')",
      `casa-${tag}`,
    ),
    away: await one(
      "INSERT INTO clubs (slug, name, short_name) VALUES (?, 'Fora', 'Fora')",
      `fora-${tag}`,
    ),
    third: await one(
      "INSERT INTO clubs (slug, name, short_name) VALUES (?, 'Outro', 'Outro')",
      `outro-${tag}`,
    ),
    tag,
  };
}
