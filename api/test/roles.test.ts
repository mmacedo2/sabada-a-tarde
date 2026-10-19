import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { managerMay } from "../src/lib/middleware";
import { adminClient, createUser, seedReference } from "./helpers";

const staff = (role: "manager" | "user") =>
  adminClient(`${role}-${crypto.randomUUID()}@test.pt`, role);

async function newGame(client: Awaited<ReturnType<typeof adminClient>>) {
  const ref = await seedReference();
  const res = await client.request("/api/admin/games", {
    method: "POST",
    json: {
      competitionId: ref.league,
      round: "1ª Jornada",
      homeClubId: ref.home,
      awayClubId: ref.away,
      date: "2026-10-17",
    },
  });
  return { res, ref, id: res.status === 201 ? ((await res.json()) as { id: number }).id : 0 };
}

describe("roles", () => {
  it("lets a manager create, edit and score games", async () => {
    const manager = await staff("manager");
    const { res, ref, id } = await newGame(manager);
    expect(res.status).toBe(201);

    expect((await manager.request("/api/admin/games?season=current")).status).toBe(200);
    expect(
      (
        await manager.request(`/api/admin/games/${id}`, {
          method: "PATCH",
          json: { status: "live" },
        })
      ).status,
    ).toBe(200);
    const goal = await manager.request(`/api/admin/games/${id}/events`, {
      method: "POST",
      json: { type: "goal", clubId: ref.home, minute: 10 },
    });
    expect(goal.status).toBe(201);
    const { events } = (await (await manager.request(`/api/admin/games/${id}`)).json()) as {
      events: { id: number }[];
    };
    expect(
      (
        await manager.request(`/api/admin/games/${id}/events/${events[0]!.id}`, {
          method: "DELETE",
        })
      ).status,
    ).not.toBe(403);
  });

  it("does not let a manager delete a game", async () => {
    const admin = await adminClient();
    const { id } = await newGame(admin);
    const manager = await staff("manager");
    expect((await manager.request(`/api/admin/games/${id}`, { method: "DELETE" })).status).toBe(
      403,
    );
    expect((await admin.request(`/api/admin/games/${id}`, { method: "DELETE" })).status).toBe(204);
  });

  it("lets a manager read only the lists the game form needs", async () => {
    const manager = await staff("manager");
    for (const path of ["/api/admin/clubs", "/api/admin/competitions", "/api/admin/seasons"]) {
      expect((await manager.request(path)).status, path).toBe(200);
    }
    for (const path of [
      "/api/admin/users",
      "/api/admin/audit",
      "/api/admin/articles",
      "/api/admin/players",
      "/api/admin/transfers",
      "/api/admin/documents",
    ]) {
      expect((await manager.request(path)).status, path).toBe(403);
    }
    const write = await manager.request("/api/admin/clubs", {
      method: "POST",
      json: { slug: `x-${crypto.randomUUID().slice(0, 8)}`, name: "X", shortName: "X" },
    });
    expect(write.status).toBe(403);
  });

  it("keeps users out of the admin API entirely", async () => {
    const user = await staff("user");
    expect((await user.request("/api/admin/games?season=current")).status).toBe(403);
    expect((await user.request("/api/admin/clubs")).status).toBe(403);
    expect((await newGame(user)).res.status).toBe(403);
  });

  it("matches the manager rule on the exact path", () => {
    expect(managerMay("PATCH", "/games/5")).toBe(true);
    expect(managerMay("DELETE", "/games/5/events/9")).toBe(true);
    expect(managerMay("DELETE", "/games/5")).toBe(false);
    expect(managerMay("GET", "/gamesx")).toBe(false);
    expect(managerMay("POST", "/clubs")).toBe(false);
    expect(managerMay("GET", "/users")).toBe(false);
  });

  it("lets admins give the manager role, but not take admin from themselves", async () => {
    const admin = await adminClient();
    const id = await createUser(`promo-${crypto.randomUUID()}@test.pt`, "user");
    const promoted = await admin.request(`/api/admin/users/${id}`, {
      method: "PATCH",
      json: { role: "manager" },
    });
    expect(promoted.status).toBe(200);
    expect(await promoted.json()).toMatchObject({ role: "manager" });

    const me = (await (await admin.request("/api/auth/me")).json()) as { id: number };
    const self = await admin.request(`/api/admin/users/${me.id}`, {
      method: "PATCH",
      json: { role: "manager" },
    });
    expect(self.status).toBe(400);
  });

  it("rejects unknown roles at the database", async () => {
    await expect(
      env.DB.prepare(
        "INSERT INTO users (email, name, password_hash, role) VALUES (?, 'x', 'x', 'root')",
      )
        .bind(`root-${crypto.randomUUID()}@test.pt`)
        .run(),
    ).rejects.toThrow(/CHECK constraint failed/);
  });
});
