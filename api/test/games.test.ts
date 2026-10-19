import { describe, expect, it } from "vitest";

import { adminClient, Client, seedReference } from "./helpers";

type Game = {
  id: number;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
  events?: { id: number }[];
};

describe("games", () => {
  it("runs a live game from kickoff to full time and updates the standings", async () => {
    const ref = await seedReference();
    const admin = await adminClient();

    const created = await admin.request("/api/admin/games", {
      method: "POST",
      json: {
        competitionId: ref.league,
        round: "1ª Jornada",
        homeClubId: ref.home,
        awayClubId: ref.away,
        date: "2026-10-17",
        kickoffTime: "15:00",
      },
    });
    expect(created.status).toBe(201);
    const game = (await created.json()) as Game;
    expect(game).toMatchObject({ status: "scheduled", homeGoals: null });

    const live = (await (
      await admin.request(`/api/admin/games/${game.id}`, {
        method: "PATCH",
        json: { status: "live" },
      })
    ).json()) as Game;
    expect(live).toMatchObject({ status: "live", homeGoals: 0, awayGoals: 0 });

    const goal = async (clubId: number, type = "goal") =>
      (await (
        await admin.request(`/api/admin/games/${game.id}/events`, {
          method: "POST",
          json: { type, clubId, minute: 10 },
        })
      ).json()) as Game;
    expect(await goal(ref.home)).toMatchObject({ homeGoals: 1, awayGoals: 0 });
    // An own goal by a home player counts for the away side.
    expect(await goal(ref.home, "own_goal")).toMatchObject({ homeGoals: 1, awayGoals: 1 });
    expect(await goal(ref.home, "yellow_card")).toMatchObject({ homeGoals: 1, awayGoals: 1 });
    expect(await goal(ref.away, "penalty_goal")).toMatchObject({ homeGoals: 1, awayGoals: 2 });

    const detail = (await (await admin.request(`/api/admin/games/${game.id}`)).json()) as Game;
    const penalty = detail.events!.at(-1)!;
    const undone = (await (
      await admin.request(`/api/admin/games/${game.id}/events/${penalty.id}`, { method: "DELETE" })
    ).json()) as Game;
    expect(undone).toMatchObject({ homeGoals: 1, awayGoals: 1 });

    expect(
      (
        await admin.request(`/api/admin/games/${game.id}`, {
          method: "PATCH",
          json: { status: "finished", homeGoals: 2 },
        })
      ).status,
    ).toBe(200);

    const table = (await (
      await new Client().request(`/api/standings/${ref.leagueSlug}`)
    ).json()) as { club: string; points: number; played: number }[];
    expect(table[0]).toMatchObject({ club: `casa-${ref.tag}`, points: 3, played: 1 });
    expect(table.find((r) => r.club === `fora-${ref.tag}`)).toMatchObject({ points: 0, played: 1 });
  });

  it("undoes a result entered by mistake: back to scheduled, no score, no events, out of the table", async () => {
    const ref = await seedReference();
    const admin = await adminClient();
    const game = (await (
      await admin.request("/api/admin/games", {
        method: "POST",
        json: {
          competitionId: ref.league,
          round: "R1",
          homeClubId: ref.home,
          awayClubId: ref.away,
          date: "2026-10-17",
        },
      })
    ).json()) as Game;
    await admin.request(`/api/admin/games/${game.id}`, {
      method: "PATCH",
      json: { status: "live" },
    });
    await admin.request(`/api/admin/games/${game.id}/events`, {
      method: "POST",
      json: { type: "goal", clubId: ref.home, minute: 5 },
    });
    await admin.request(`/api/admin/games/${game.id}`, {
      method: "PATCH",
      json: { status: "finished", homePenalties: 4, awayPenalties: 3 },
    });

    // The form sends the old score along with the new status; the score must still go.
    const reverted = await admin.request(`/api/admin/games/${game.id}`, {
      method: "PATCH",
      json: { status: "scheduled", homeGoals: 1, awayGoals: 0 },
    });
    expect(reverted.status).toBe(200);
    expect(await reverted.json()).toMatchObject({
      status: "scheduled",
      homeGoals: null,
      awayGoals: null,
      homePenalties: null,
      awayPenalties: null,
    });
    const detail = (await (await admin.request(`/api/admin/games/${game.id}`)).json()) as Game;
    expect(detail.events).toEqual([]);

    const table = (await (
      await new Client().request(`/api/standings/${ref.leagueSlug}`)
    ).json()) as {
      played: number;
      points: number;
    }[];
    expect(table.every((r) => r.played === 0 && r.points === 0)).toBe(true);

    // And it can be played again from scratch.
    const restarted = (await (
      await admin.request(`/api/admin/games/${game.id}`, {
        method: "PATCH",
        json: { status: "live" },
      })
    ).json()) as Game;
    expect(restarted).toMatchObject({ status: "live", homeGoals: 0, awayGoals: 0 });
  });

  it("keeps the score when only other details of a played game change", async () => {
    const ref = await seedReference();
    const admin = await adminClient();
    const game = (await (
      await admin.request("/api/admin/games", {
        method: "POST",
        json: {
          competitionId: ref.league,
          round: "R1",
          homeClubId: ref.home,
          awayClubId: ref.away,
          date: "2026-10-17",
          status: "finished",
          homeGoals: 2,
          awayGoals: 1,
        },
      })
    ).json()) as Game;
    const edited = await admin.request(`/api/admin/games/${game.id}`, {
      method: "PATCH",
      json: { venue: "Campo de Pinheiro" },
    });
    expect(await edited.json()).toMatchObject({ status: "finished", homeGoals: 2, awayGoals: 1 });
  });

  it("refuses events before kickoff and for clubs outside the game", async () => {
    const ref = await seedReference();
    const admin = await adminClient();
    const game = (await (
      await admin.request("/api/admin/games", {
        method: "POST",
        json: {
          competitionId: ref.league,
          round: "R1",
          homeClubId: ref.home,
          awayClubId: ref.away,
          date: "2026-10-17",
        },
      })
    ).json()) as Game;

    const early = await admin.request(`/api/admin/games/${game.id}/events`, {
      method: "POST",
      json: { type: "goal", clubId: ref.home },
    });
    expect(early.status).toBe(409);

    await admin.request(`/api/admin/games/${game.id}`, {
      method: "PATCH",
      json: { status: "live" },
    });
    const outsider = await admin.request(`/api/admin/games/${game.id}/events`, {
      method: "POST",
      json: { type: "goal", clubId: ref.third },
    });
    expect(outsider.status).toBe(400);
  });

  it("accepts undecided cup ties and rejects a club playing itself", async () => {
    const ref = await seedReference();
    const admin = await adminClient();
    const tbd = await admin.request("/api/admin/games", {
      method: "POST",
      json: {
        competitionId: ref.league,
        round: "Final",
        homePlaceholder: "Vencedor jogo 5",
        awayPlaceholder: "Vencedor jogo 6",
        date: "2027-06-05",
      },
    });
    expect(tbd.status).toBe(201);

    const self = await admin.request("/api/admin/games", {
      method: "POST",
      json: {
        competitionId: ref.league,
        round: "R1",
        homeClubId: ref.home,
        awayClubId: ref.home,
        date: "2026-10-17",
      },
    });
    expect(self.status).toBe(400);
  });

  it("hides invisible games from the public list but not from admins", async () => {
    const ref = await seedReference();
    const admin = await adminClient();
    await admin.request("/api/admin/games", {
      method: "POST",
      json: {
        competitionId: ref.league,
        round: "R1",
        homeClubId: ref.home,
        awayClubId: ref.away,
        date: "2026-10-17",
        visible: false,
      },
    });
    const publicGames = (await (
      await new Client().request(`/api/games?competition=${ref.leagueSlug}`)
    ).json()) as Game[];
    const adminGames = (await (
      await admin.request(`/api/admin/games?competition=${ref.leagueSlug}`)
    ).json()) as Game[];
    expect(publicGames).toHaveLength(0);
    expect(adminGames).toHaveLength(1);
  });

  it("returns 409 when deleting a club that has games", async () => {
    const ref = await seedReference();
    const admin = await adminClient();
    await admin.request("/api/admin/games", {
      method: "POST",
      json: {
        competitionId: ref.league,
        round: "R1",
        homeClubId: ref.home,
        awayClubId: ref.away,
        date: "2026-10-17",
      },
    });
    expect((await admin.request(`/api/admin/clubs/${ref.home}`, { method: "DELETE" })).status).toBe(
      409,
    );
  });
});
