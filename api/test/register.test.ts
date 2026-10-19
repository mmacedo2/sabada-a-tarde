import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { Client, createUser } from "./helpers";

const register = (client: Client, json: Record<string, unknown>, ip = crypto.randomUUID()) =>
  client.request("/api/auth/register", {
    method: "POST",
    json,
    headers: { "cf-connecting-ip": ip },
  });

describe("register", () => {
  it("creates an unverified user account and signs it in", async () => {
    const client = new Client();
    const res = await register(client, {
      name: "Adepto",
      email: "Adepto@Test.pt",
      password: "uma-boa-palavra",
    });
    expect(res.status).toBe(201);
    expect(await (await client.request("/api/auth/me")).json()).toMatchObject({
      email: "adepto@test.pt",
      role: "user",
    });
    const row = await env.DB.prepare("SELECT email_verified FROM users WHERE email = ?")
      .bind("adepto@test.pt")
      .first();
    expect(row).toEqual({ email_verified: 0 });
    expect((await new Client().login("adepto@test.pt", "uma-boa-palavra")).status).toBe(200);
  });

  it("ignores a role sent in the body", async () => {
    const client = new Client();
    await register(client, {
      name: "Esperto",
      email: "esperto@test.pt",
      password: "uma-boa-palavra",
      role: "admin",
    });
    expect(await (await client.request("/api/auth/me")).json()).toMatchObject({ role: "user" });
    expect((await client.request("/api/admin/users")).status).toBe(403);
  });

  it("refuses an email that already has an account", async () => {
    await createUser("ocupado@test.pt", "admin");
    const res = await register(new Client(), {
      name: "Outro",
      email: "ocupado@test.pt",
      password: "uma-boa-palavra",
    });
    expect(res.status).toBe(409);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("requires a password of at least 10 characters", async () => {
    const res = await register(new Client(), {
      name: "Curto",
      email: "curto@test.pt",
      password: "curta",
    });
    expect(res.status).toBe(400);
  });

  it("throttles registrations from one network", async () => {
    const ip = crypto.randomUUID();
    for (let i = 0; i < 5; i++) {
      const res = await register(
        new Client(),
        { name: `R${i}`, email: `rede${i}@test.pt`, password: "uma-boa-palavra" },
        ip,
      );
      expect(res.status).toBe(201);
    }
    const blocked = await register(
      new Client(),
      { name: "R5", email: "rede5@test.pt", password: "uma-boa-palavra" },
      ip,
    );
    expect(blocked.status).toBe(429);
  });

  it("refuses registrations from another site", async () => {
    const res = await new Client().request("/api/auth/register", {
      method: "POST",
      json: { name: "X", email: "csrf-reg@test.pt", password: "uma-boa-palavra" },
      headers: { origin: "https://evil.example" },
    });
    expect(res.status).toBe(403);
  });
});
