import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { MatchCard } from "@/components/site/MatchCard";
import { PageHeader } from "@/components/site/PageHeader";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { api, byDateAsc, byDateDesc, isLive, isPlayed, type Game } from "@/lib/api";
import { useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/resultados")({
  loader: () => api.get<Game[]>("/api/games"),
  head: () => ({
    meta: [
      { title: "Resultados e próximos jogos — Sábado à Tarde" },
      {
        name: "description",
        content:
          "Todos os resultados e próximos jogos das competições da AFPG, com filtros por competição, jornada e equipa.",
      },
      { property: "og:title", content: "Resultados — Sábado à Tarde" },
      {
        property: "og:description",
        content: "Resultados e próximos jogos do futebol popular de Guimarães.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/resultados" },
    ],
    links: [{ rel: "canonical", href: "/resultados" }],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const [competition, setCompetition] = useState("todas");
  const [round, setRound] = useState("todas");
  const [club, setClub] = useState("todas");
  const [mode, setMode] = useState<"resultados" | "proximos">("resultados");

  const matches = Route.useLoaderData();
  const { season, clubs, competitions } = useCatalog();
  useLiveRefresh(matches.some(isLive));

  const rounds = useMemo(
    () => Array.from(new Set([...matches].sort(byDateAsc).map((m) => m.round))),
    [matches],
  );
  // Games being played show under results, with their live score.
  const results = useMemo(
    () => matches.filter((m) => isPlayed(m) || isLive(m)).sort(byDateDesc),
    [matches],
  );
  const upcoming = useMemo(
    () => matches.filter((m) => !isPlayed(m) && !isLive(m)).sort(byDateAsc),
    [matches],
  );

  const list = (mode === "resultados" ? results : upcoming).filter(
    (m) =>
      (competition === "todas" || m.competition === competition) &&
      (round === "todas" || m.round === round) &&
      (club === "todas" || m.home === club || m.away === club),
  );

  return (
    <>
      <PageHeader
        eyebrow={season ? `Época ${season.name}` : undefined}
        title="Resultados"
        description="Consulte resultados e próximos jogos por competição, jornada ou equipa."
      />

      <section className="container-afpg py-12 md:py-16">
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {(["resultados", "proximos"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`eyebrow rounded-md px-4 py-2.5 transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {m === "resultados" ? "Resultados" : "Próximos jogos"}
              </button>
            ))}
          </div>

          <Select label="Competição" value={competition} onChange={setCompetition}>
            <option value="todas">Todas</option>
            {competitions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select label="Jornada" value={round} onChange={setRound}>
            <option value="todas">Todas</option>
            {rounds.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>

          <Select label="Equipa" value={club} onChange={setClub}>
            <option value="todas">Todas</option>
            {clubs.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.shortName}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>

        {list.length === 0 && (
          <p className="mt-8 rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground">
            Sem jogos para os filtros selecionados.
          </p>
        )}
      </section>
    </>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const id = `filtro-${label.toLowerCase().replace(/\s/g, "-")}`;
  return (
    <div className="min-w-40">
      <label htmlFor={id} className="eyebrow mb-1.5 block text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
      >
        {children}
      </select>
    </div>
  );
}
