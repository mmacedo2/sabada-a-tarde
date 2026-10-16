import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { GameForm, type GameInput } from "@/components/admin/GameForm";
import {
  AdminSection,
  Empty,
  QueryState,
  inputClass,
  useAdminMutation,
} from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/data/afpg";
import { adminQueries } from "@/lib/admin-queries";
import { api, byDateAsc, statusLabel, type Game } from "@/lib/api";

export const Route = createFileRoute("/admin/jogos/")({ component: GamesAdmin });

function GamesAdmin() {
  const navigate = useNavigate();
  const seasons = useQuery(adminQueries.seasons);
  const [season, setSeason] = useState<number | "current">("current");
  const games = useQuery(adminQueries.games(season));
  const clubs = useQuery(adminQueries.clubs);
  const competitions = useQuery(adminQueries.competitions);
  const [competition, setCompetition] = useState("");
  const [round, setRound] = useState("");
  const [creating, setCreating] = useState(false);

  const create = useAdminMutation(
    (input: GameInput) =>
      api.post<Game>("/api/admin/games", {
        ...input,
        seasonId: season === "current" ? undefined : season,
      }),
    {
      invalidate: [["admin", "games"]],
      public: true,
      success: "Jogo criado.",
      onSuccess: (game) =>
        void navigate({ to: "/admin/jogos/$id", params: { id: String(game.id) } }),
    },
  );

  const all = useMemo(() => [...(games.data ?? [])].sort(byDateAsc), [games.data]);
  const rounds = useMemo(
    () => [
      ...new Set(
        all.filter((g) => !competition || g.competition === competition).map((g) => g.round),
      ),
    ],
    [all, competition],
  );
  const shown = all.filter(
    (g) => (!competition || g.competition === competition) && (!round || g.round === round),
  );
  const clubName = (id: number | null, placeholder: string | null) =>
    clubs.data?.find((c) => c.id === id)?.shortName ?? placeholder ?? "—";

  return (
    <>
      <AdminSection
        title="Jogos"
        actions={
          <Button variant={creating ? "outline" : "default"} onClick={() => setCreating((v) => !v)}>
            {creating ? "Fechar" : "Novo jogo"}
          </Button>
        }
      >
        {creating && clubs.data && competitions.data && (
          <div className="mb-8 rounded-lg border border-border p-4">
            <GameForm
              clubs={clubs.data}
              competitions={competitions.data}
              pending={create.isPending}
              submitLabel="Criar jogo"
              onSubmit={(input) => create.mutate(input)}
            />
          </div>
        )}

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <select
            aria-label="Época"
            className={inputClass}
            value={season}
            onChange={(e) =>
              setSeason(e.target.value === "current" ? "current" : Number(e.target.value))
            }
          >
            <option value="current">Época atual</option>
            {seasons.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Competição"
            className={inputClass}
            value={competition}
            onChange={(e) => {
              setCompetition(e.target.value);
              setRound("");
            }}
          >
            <option value="">Todas as competições</option>
            {competitions.data?.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Jornada"
            className={inputClass}
            value={round}
            onChange={(e) => setRound(e.target.value)}
          >
            <option value="">Todas as jornadas</option>
            {rounds.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <QueryState isLoading={games.isLoading} error={games.error} />
        {games.data && shown.length === 0 && <Empty>Sem jogos para estes filtros.</Empty>}
        {shown.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="eyebrow text-left text-muted-foreground">
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2 pr-3">Jornada</th>
                  <th className="py-2 pr-3">Jogo</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {shown.map((g) => (
                  <tr
                    key={g.id}
                    className={`border-t border-border ${g.visible ? "" : "opacity-50"}`}
                  >
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {formatShortDate(g.date)} {g.kickoffTime}
                    </td>
                    <td className="py-2.5 pr-3">{g.stage ? `${g.round} · ${g.stage}` : g.round}</td>
                    <td className="py-2.5 pr-3 font-semibold">
                      {clubName(g.homeClubId, g.homePlaceholder)}{" "}
                      <span className="stat text-primary">
                        {g.homeGoals != null ? `${g.homeGoals}–${g.awayGoals}` : "vs"}
                      </span>{" "}
                      {clubName(g.awayClubId, g.awayPlaceholder)}
                    </td>
                    <td className="py-2.5 pr-3">{statusLabel[g.status]}</td>
                    <td className="py-2.5 text-right">
                      <Link
                        to="/admin/jogos/$id"
                        params={{ id: String(g.id) }}
                        className="text-primary hover:underline"
                      >
                        Gerir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>
    </>
  );
}
