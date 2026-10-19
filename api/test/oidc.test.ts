import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../src/index";
import { codeChallenge } from "../src/lib/oidc";
import { Client, ORIGIN, createUser } from "./helpers";

const ISSUER = "https://idp.test";

type Userinfo = { sub: string; email?: string; email_verified?: boolean | string; name?: string };

/** Answers the provider's discovery, token and userinfo endpoints. */
function fakeProvider(userinfo: Userinfo) {
  const calls: { url: string; body: string | null }[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    calls.push({ url, body: init?.body ? String(init.body) : null });
    if (url === `${ISSUER}/.well-known/openid-configuration`) {
      return Response.json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/authorize`,
        token_endpoint: `${ISSUER}/token`,
        userinfo_endpoint: `${ISSUER}/userinfo`,
      });
    }
    if (url === `${ISSUER}/token`) return Response.json({ access_token: "access-1" });
    if (url === `${ISSUER}/userinfo`) {
      const auth = new Headers(init?.headers).get("authorization");
      return auth === "Bearer access-1"
        ? Response.json(userinfo)
        : new Response("unauthorized", { status: 401 });
    }
    return new Response("unexpected", { status: 500 });
  });
  return calls;
}

/** Cookies from every Set-Cookie header, as a Cookie request header. */
const cookiesFrom = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0]!)
    .filter((pair) => !pair.endsWith("="))
    .join("; ");

/** Runs /start, then the callback as the provider would redirect to it. */
async function signIn(userinfo: Userinfo, redirect?: string) {
  const calls = fakeProvider(userinfo);
  const start = await app.request(
    `${ORIGIN}/api/auth/oidc/start${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`,
    { headers: { host: "localhost" } },
    env,
  );
  const state = new URL(start.headers.get("location")!).searchParams.get("state")!;
  const callback = await app.request(
    `${ORIGIN}/api/auth/oidc/callback?code=code-1&state=${state}`,
    { headers: { host: "localhost", cookie: cookiesFrom(start) } },
    env,
  );
  const client = new Client();
  client.cookie = cookiesFrom(callback);
  return { start, callback, client, calls };
}

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("oidc", () => {
  it("advertises the provider to the login page", async () => {
    expect(await (await new Client().request("/api/auth/providers")).json()).toEqual({
      oidc: { name: "Google" },
    });
  });

  it("is off when not configured", async () => {
    const bare = { ...env, OIDC_ISSUER: "", OIDC_CLIENT_ID: "", OIDC_CLIENT_SECRET: "" };
    const providers = await app.request(`${ORIGIN}/api/auth/providers`, {}, bare);
    expect(await providers.json()).toEqual({ oidc: null });
    expect((await app.request(`${ORIGIN}/api/auth/oidc/start`, {}, bare)).status).toBe(404);
  });

  it("refuses to start when only part of the configuration is set", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const partial = { ...env, OIDC_CLIENT_SECRET: "" };
    expect((await app.request(`${ORIGIN}/api/auth/oidc/start`, {}, partial)).status).toBe(500);
  });

  it("starts the code flow with PKCE and a state cookie", async () => {
    const { start, calls } = await signIn({
      sub: "s-start",
      email: "s@test.pt",
      email_verified: true,
    });
    expect(start.status).toBe(302);
    const location = new URL(start.headers.get("location")!);
    expect(`${location.origin}${location.pathname}`).toBe(`${ISSUER}/authorize`);
    expect(Object.fromEntries(location.searchParams)).toMatchObject({
      response_type: "code",
      client_id: "client-1",
      redirect_uri: `${ORIGIN}/api/auth/oidc/callback`,
      scope: "openid email profile",
      code_challenge_method: "S256",
    });
    const cookie = start.headers.getSetCookie()[0]!;
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/api/auth/oidc");

    // The token request proves possession of the verifier behind the challenge.
    const token = new URLSearchParams(calls.find((c) => c.url.endsWith("/token"))!.body!);
    expect(token.get("client_secret")).toBe("secret-1");
    expect(await codeChallenge(token.get("code_verifier")!)).toBe(
      location.searchParams.get("code_challenge"),
    );
  });

  it("registers a new user with the user role and no password", async () => {
    const { callback, client } = await signIn({
      sub: "s-new",
      email: "Nova@Test.pt",
      email_verified: true,
      name: "Nova Adepta",
    });
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toBe("/");
    expect(await (await client.request("/api/auth/me")).json()).toMatchObject({
      email: "nova@test.pt",
      name: "Nova Adepta",
      role: "user",
    });
    expect((await new Client().login("nova@test.pt", "!")).status).toBe(401);
    const audit = await env.DB.prepare(
      "SELECT action, user_id FROM audit_log WHERE entity = 'user' AND details LIKE '%nova@test.pt%'",
    ).first();
    expect(audit).toEqual({ action: "create", user_id: null });
  });

  it("signs the same account in again even after its email changes", async () => {
    await signIn({ sub: "s-same", email: "antes@test.pt", email_verified: true });
    const { client } = await signIn({
      sub: "s-same",
      email: "depois@test.pt",
      email_verified: true,
    });
    expect(await (await client.request("/api/auth/me")).json()).toMatchObject({
      email: "antes@test.pt",
    });
    const users = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM users WHERE email IN ('antes@test.pt', 'depois@test.pt')",
    ).first<{ n: number }>();
    expect(users!.n).toBe(1);
  });

  it("links an existing admin by verified email and honours the admin redirect", async () => {
    await createUser("chefe@test.pt", "admin");
    const { callback, client } = await signIn(
      { sub: "s-admin", email: "chefe@test.pt", email_verified: "true" },
      "/admin/jogos",
    );
    expect(callback.headers.get("location")).toBe("/admin/jogos");
    expect(await (await client.request("/api/auth/me")).json()).toMatchObject({ role: "admin" });
    // The password keeps working alongside the provider.
    expect((await new Client().login("chefe@test.pt")).status).toBe(200);
  });

  it("never redirects outside the admin area", async () => {
    await createUser("fora@test.pt", "admin");
    const { callback } = await signIn(
      { sub: "s-fora", email: "fora@test.pt", email_verified: true },
      "//evil.example/admin",
    );
    expect(callback.headers.get("location")).toBe("/admin");
  });

  it("refuses an unverified email instead of creating or linking an account", async () => {
    await createUser("vitima@test.pt", "admin");
    const { callback } = await signIn({
      sub: "s-unverified",
      email: "vitima@test.pt",
      email_verified: false,
    });
    expect(callback.headers.get("location")).toBe("/entrar?erro=email");
    const links = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM user_identities WHERE subject = 's-unverified'",
    ).first<{ n: number }>();
    expect(links!.n).toBe(0);
  });

  it("refuses inactive users", async () => {
    const id = await createUser("inativo@test.pt", "user");
    await env.DB.prepare("UPDATE users SET active = 0 WHERE id = ?").bind(id).run();
    const { callback } = await signIn({
      sub: "s-inactive",
      email: "inativo@test.pt",
      email_verified: true,
    });
    expect(callback.headers.get("location")).toBe("/entrar?erro=inativo");
    expect(cookiesFrom(callback)).not.toContain("sat_session");
  });

  it("rejects a callback this browser did not start", async () => {
    const calls = fakeProvider({ sub: "s-csrf", email: "csrf@test.pt", email_verified: true });
    const res = await app.request(
      `${ORIGIN}/api/auth/oidc/callback?code=code-1&state=forged`,
      { headers: { host: "localhost" } },
      env,
    );
    expect(res.headers.get("location")).toBe("/entrar?erro=sessao");
    expect(calls.some((c) => c.url.endsWith("/token"))).toBe(false);
  });

  it("reports a cancelled consent screen", async () => {
    const res = await app.request(
      `${ORIGIN}/api/auth/oidc/callback?error=access_denied`,
      { headers: { host: "localhost" } },
      env,
    );
    expect(res.headers.get("location")).toBe("/entrar?erro=cancelado");
  });

  it("sends the user back with an error when the provider fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    fakeProvider({ sub: "s-fail" });
    const start = await app.request(
      `${ORIGIN}/api/auth/oidc/start`,
      { headers: { host: "localhost" } },
      env,
    );
    const state = new URL(start.headers.get("location")!).searchParams.get("state")!;
    vi.mocked(fetch).mockImplementation(async () => new Response("boom", { status: 502 }));
    const res = await app.request(
      `${ORIGIN}/api/auth/oidc/callback?code=code-1&state=${state}`,
      { headers: { host: "localhost", cookie: cookiesFrom(start) } },
      env,
    );
    expect(res.headers.get("location")).toBe("/entrar?erro=oidc");
    expect(fetch).toHaveBeenCalledWith(`${ISSUER}/token`, expect.anything());
    expect(cookiesFrom(res)).not.toContain("sat_session");
  });
});

describe("oidc with self-registered accounts and roles", () => {
  it("lets the verified owner take over an account someone registered with their email", async () => {
    const squatter = new Client();
    const reg = await squatter.request("/api/auth/register", {
      method: "POST",
      json: { name: "Impostor", email: "dono@test.pt", password: "palavra-do-impostor" },
      headers: { "cf-connecting-ip": crypto.randomUUID() },
    });
    expect(reg.status).toBe(201);

    const { client } = await signIn({
      sub: "s-owner",
      email: "dono@test.pt",
      email_verified: true,
    });
    expect(await (await client.request("/api/auth/me")).json()).toMatchObject({
      email: "dono@test.pt",
    });
    // The impostor is signed out and their password no longer works.
    expect(await (await squatter.request("/api/auth/me")).json()).toBeNull();
    expect((await new Client().login("dono@test.pt", "palavra-do-impostor")).status).toBe(401);
    const row = await env.DB.prepare("SELECT email_verified FROM users WHERE email = ?")
      .bind("dono@test.pt")
      .first();
    expect(row).toEqual({ email_verified: 1 });
  });

  it("keeps the password and sessions of an account an admin created", async () => {
    await createUser("criado@test.pt", "user");
    const before = new Client();
    await before.login("criado@test.pt");
    await signIn({ sub: "s-criado", email: "criado@test.pt", email_verified: true });
    expect(await (await before.request("/api/auth/me")).json()).toMatchObject({
      email: "criado@test.pt",
    });
    expect((await new Client().login("criado@test.pt")).status).toBe(200);
  });

  it("sends a manager to the games screens", async () => {
    await createUser("gestor@test.pt", "manager");
    const toUsers = await signIn(
      { sub: "s-gestor", email: "gestor@test.pt", email_verified: true },
      "/admin/utilizadores",
    );
    expect(toUsers.callback.headers.get("location")).toBe("/admin/jogos");
    const toGame = await signIn(
      { sub: "s-gestor", email: "gestor@test.pt", email_verified: true },
      "/admin/jogos/12",
    );
    expect(toGame.callback.headers.get("location")).toBe("/admin/jogos/12");
  });
});
