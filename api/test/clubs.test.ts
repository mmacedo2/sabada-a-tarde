import { describe, expect, it } from "vitest";

import { adminClient, Client } from "./helpers";

type Club = { id: number; slug: string; wallpaperUrl: string | null };

const newClub = (overrides: Record<string, unknown> = {}) => ({
  slug: `clube-${crypto.randomUUID().slice(0, 8)}`,
  name: "Clube de Teste",
  shortName: "Teste",
  ...overrides,
});

describe("club wallpaper", () => {
  it("is saved by an admin and published in the catalog", async () => {
    const admin = await adminClient();
    const created = await admin.request("/api/admin/clubs", {
      method: "POST",
      json: newClub({ wallpaperUrl: "/api/media/uploads/fundo.jpg" }),
    });
    expect(created.status).toBe(201);
    const club = (await created.json()) as Club;
    expect(club.wallpaperUrl).toBe("/api/media/uploads/fundo.jpg");

    const catalog = (await (await new Client().request("/api/catalog")).json()) as {
      clubs: Club[];
    };
    expect(catalog.clubs.find((c) => c.slug === club.slug)?.wallpaperUrl).toBe(
      "/api/media/uploads/fundo.jpg",
    );
  });

  it("accepts an https address and can be removed again", async () => {
    const admin = await adminClient();
    const club = (await (
      await admin.request("/api/admin/clubs", {
        method: "POST",
        json: newClub({ wallpaperUrl: "https://example.com/fundo.webp" }),
      })
    ).json()) as Club;
    expect(club.wallpaperUrl).toBe("https://example.com/fundo.webp");

    const cleared = await admin.request(`/api/admin/clubs/${club.id}`, {
      method: "PATCH",
      json: { wallpaperUrl: "" },
    });
    expect(((await cleared.json()) as Club).wallpaperUrl).toBeNull();
  });

  it("rejects addresses that are not http(s) or a site path", async () => {
    const admin = await adminClient();
    for (const wallpaperUrl of [
      "javascript:alert(1)",
      "//evil.example/x.jpg",
      "data:image/png;base64,AAAA",
    ]) {
      const res = await admin.request("/api/admin/clubs", {
        method: "POST",
        json: newClub({ wallpaperUrl }),
      });
      expect(res.status, wallpaperUrl).toBe(400);
    }
  });
});
