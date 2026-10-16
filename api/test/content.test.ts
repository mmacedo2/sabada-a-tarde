import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { adminClient, Client, createUser, seedReference } from "./helpers";

describe("articles", () => {
  it("publishes only published, non-scheduled articles and keeps slugs unique", async () => {
    const admin = await adminClient();
    const post = (json: Record<string, unknown>) =>
      admin.request("/api/admin/articles", { method: "POST", json });

    const draft = (await (await post({ title: "Rascunho secreto", body: "..." })).json()) as {
      slug: string;
    };
    const first = (await (
      await post({ title: "Vitória épica!", body: "Texto", status: "published" })
    ).json()) as { slug: string };
    const second = (await (
      await post({ title: "Vitória épica!", body: "Texto", status: "published" })
    ).json()) as { slug: string };
    await post({
      title: "Futuro",
      body: "Texto",
      status: "published",
      publishedAt: "2099-01-01T10:00:00+01:00",
    });

    expect(first.slug).toBe("vitoria-epica");
    expect(second.slug).toBe("vitoria-epica-2");

    const visitor = new Client();
    const list = (await (await visitor.request("/api/articles")).json()) as { title: string }[];
    expect(list.map((a) => a.title)).toEqual(expect.arrayContaining(["Vitória épica!"]));
    expect(list.map((a) => a.title)).not.toContain("Rascunho secreto");
    expect(list.map((a) => a.title)).not.toContain("Futuro");
    expect((await visitor.request(`/api/articles/${draft.slug}`)).status).toBe(404);
  });

  it("rejects script URLs for covers", async () => {
    const admin = await adminClient();
    const res = await admin.request("/api/admin/articles", {
      method: "POST",
      json: { title: "XSS", body: "x", coverUrl: "javascript:alert(1)" },
    });
    expect(res.status).toBe(400);
  });
});

describe("users", () => {
  it("creates users, blocks self-demotion and signs out deactivated users", async () => {
    const admin = await adminClient("boss@test.pt");
    const me = (await (await admin.request("/api/auth/me")).json()) as { id: number };

    const created = await admin.request("/api/admin/users", {
      method: "POST",
      json: {
        email: "Editor@Test.pt",
        name: "Editor",
        password: "editor-password-1",
        role: "admin",
      },
    });
    expect(created.status).toBe(201);
    const editor = (await created.json()) as { id: number; email: string };
    expect(editor.email).toBe("editor@test.pt");
    expect(Object.keys(editor)).not.toContain("passwordHash");

    const duplicate = await admin.request("/api/admin/users", {
      method: "POST",
      json: { email: "editor@test.pt", name: "Dup", password: "editor-password-1" },
    });
    expect(duplicate.status).toBe(409);

    expect(
      (
        await admin.request(`/api/admin/users/${me.id}`, {
          method: "PATCH",
          json: { role: "user" },
        })
      ).status,
    ).toBe(400);

    const editorClient = new Client();
    await editorClient.login("editor@test.pt", "editor-password-1");
    await admin.request(`/api/admin/users/${editor.id}`, {
      method: "PATCH",
      json: { active: false },
    });
    expect(await (await editorClient.request("/api/auth/me")).json()).toBeNull();
  });
});

describe("transfers", () => {
  it("moves the player to the club of their latest transfer", async () => {
    const ref = await seedReference();
    const admin = await adminClient();
    const player = (await (
      await admin.request("/api/admin/players", {
        method: "POST",
        json: { name: "Zé", clubId: ref.home },
      })
    ).json()) as { id: number };
    const clubOf = async () =>
      (await env.DB.prepare("SELECT club_id FROM players WHERE id = ?")
        .bind(player.id)
        .first<{ club_id: number }>())!.club_id;

    const latest = (await (
      await admin.request("/api/admin/transfers", {
        method: "POST",
        json: { playerId: player.id, fromClubId: ref.home, toClubId: ref.away, date: "2026-11-01" },
      })
    ).json()) as { id: number };
    expect(await clubOf()).toBe(ref.away);

    // Back-dated transfer does not override the newer one.
    await admin.request("/api/admin/transfers", {
      method: "POST",
      json: { playerId: player.id, fromClubId: ref.third, toClubId: ref.home, date: "2026-01-01" },
    });
    expect(await clubOf()).toBe(ref.away);

    await admin.request(`/api/admin/transfers/${latest.id}`, { method: "DELETE" });
    expect(await clubOf()).toBe(ref.home);

    const publicList = (await (await new Client().request("/api/transfers")).json()) as {
      playerName: string;
    }[];
    expect(publicList.some((t) => t.playerName === "Zé")).toBe(true);
  });
});

describe("uploads", () => {
  const upload = async (client: Client, bytes: Uint8Array, name: string) => {
    const form = new FormData();
    form.append("file", new File([bytes], name));
    return client.request("/api/admin/uploads", { method: "POST", body: form });
  };

  it("stores real images and serves them back", async () => {
    const admin = await adminClient();
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const res = await upload(admin, png, "crest.png");
    expect(res.status).toBe(201);
    const { url } = (await res.json()) as { url: string };
    expect(url).toMatch(/^\/api\/media\/uploads\/\d{4}\/[0-9a-f-]{36}\.png$/);

    const served = await new Client().request(url);
    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/png");
  });

  it("rejects files that are not images whatever their name", async () => {
    const admin = await adminClient();
    const svg = new TextEncoder().encode("<svg onload=alert(1)>");
    expect((await upload(admin, svg, "logo.png")).status).toBe(415);
  });

  it("does not serve arbitrary bucket keys", async () => {
    expect((await new Client().request("/api/media/../secrets.txt")).status).toBe(404);
  });
});

describe("seasons", () => {
  it("keeps exactly one current season", async () => {
    await seedReference();
    await createUser("season-admin@test.pt");
    const admin = new Client();
    await admin.login("season-admin@test.pt");
    const created = (await (
      await admin.request("/api/admin/seasons", {
        method: "POST",
        json: {
          name: `2099/2100-${crypto.randomUUID().slice(0, 4)}`,
          startsOn: "2099-09-01",
          endsOn: "2100-06-30",
          isCurrent: true,
        },
      })
    ).json()) as { id: number; isCurrent: boolean };
    expect(created.isCurrent).toBe(true);
    const current = await env.DB.prepare("SELECT id FROM seasons WHERE is_current = 1").all();
    expect(current.results).toEqual([{ id: created.id }]);
  });
});
