import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { Client, createUser } from "./helpers";

describe("auth", () => {
  it("logs in, reports the session user and logs out", async () => {
    await createUser("ana@test.pt");
    const client = new Client();

    const login = await client.login("ana@test.pt");
    expect(login.status).toBe(200);
    const cookie = login.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/api");

    expect(await (await client.request("/api/auth/me")).json()).toMatchObject({
      email: "ana@test.pt",
      role: "admin",
    });

    const stale = client.cookie;
    expect((await client.request("/api/auth/logout", { method: "POST" })).status).toBe(204);
    client.cookie = stale;
    expect(await (await client.request("/api/auth/me")).json()).toBeNull();
  });

  it("stores only a hash of the session token", async () => {
    await createUser("hash@test.pt");
    const client = new Client();
    await client.login("hash@test.pt");
    const token = client.cookie.split("=")[1]!;
    const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM sessions WHERE id = ?")
      .bind(token)
      .first<{ n: number }>();
    expect(row!.n).toBe(0);
  });

  it("gives the same answer for an unknown email and a wrong password", async () => {
    await createUser("known@test.pt");
    const wrong = await new Client().login("known@test.pt", "wrong-password-1");
    const unknown = await new Client().login("nobody@test.pt", "wrong-password-1");
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(await wrong.json()).toEqual(await unknown.json());
  });

  it("throttles repeated failures for an email", async () => {
    await createUser("brute@test.pt");
    for (let i = 0; i < 5; i++)
      expect((await new Client().login("brute@test.pt", "nope-nope-nope")).status).toBe(401);
    // Even the right password is refused while throttled.
    expect((await new Client().login("brute@test.pt")).status).toBe(429);
  });

  it("refuses inactive users", async () => {
    const id = await createUser("gone@test.pt");
    await env.DB.prepare("UPDATE users SET active = 0 WHERE id = ?").bind(id).run();
    expect((await new Client().login("gone@test.pt")).status).toBe(401);
  });

  it("rejects writes from another origin or without an origin", async () => {
    const res = await new Client().request("/api/auth/login", {
      method: "POST",
      json: { email: "x@test.pt", password: "whatever-123" },
      headers: { origin: "https://evil.example" },
    });
    expect(res.status).toBe(403);
  });

  it("changes the password and signs out other sessions", async () => {
    await createUser("pw@test.pt");
    const phone = new Client();
    await phone.login("pw@test.pt");
    const laptop = new Client();
    await laptop.login("pw@test.pt");

    const res = await laptop.request("/api/auth/password", {
      method: "POST",
      json: { currentPassword: "correct-horse-battery", newPassword: "a-brand-new-password" },
    });
    expect(res.status).toBe(204);
    expect(await (await laptop.request("/api/auth/me")).json()).not.toBeNull();
    expect(await (await phone.request("/api/auth/me")).json()).toBeNull();
    expect((await new Client().login("pw@test.pt", "a-brand-new-password")).status).toBe(200);
  });
});

describe("admin guard", () => {
  it("requires a session and the admin role", async () => {
    expect((await new Client().request("/api/admin/users")).status).toBe(401);

    await createUser("reader@test.pt", "user");
    const reader = new Client();
    await reader.login("reader@test.pt");
    expect((await reader.request("/api/admin/users")).status).toBe(403);
    expect(
      (
        await reader.request("/api/admin/articles", {
          method: "POST",
          json: { title: "x", body: "y" },
        })
      ).status,
    ).toBe(403);
  });
});
