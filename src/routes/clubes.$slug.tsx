import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { AdminEditLink } from "@/components/site/AdminEditLink";
import { Crest } from "@/components/site/Crest";
import { MatchCard } from "@/components/site/MatchCard";
import { SectionTitle } from "@/components/site/PageHeader";
import { StandingsTable } from "@/components/site/StandingsTable";
import { formatDate } from "@/data/afpg";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import {
  api,
  byDateAsc,
  byDateDesc,
  catalogQuery,
  isLive,
  isPlayed,
  leagueLabel,
  loadMainLeague,
  type Game,
  type Player,
  type PlayerPosition,
} from "@/lib/api";
import { useCatalog } from "@/lib/catalog";

const positionLabel: Record<PlayerPosition, string> = {
  goalkeeper: "Guarda-redes",
  defender: "Defesa",
  midfielder: "Médio",
  forward: "Avançado",
};

export const Route = createFileRoute("/clubes/$slug")({
  loader: async ({ params, context }) => {
    const catalog = await context.queryClient.fetchQuery(catalogQuery);
    const club = catalog.clubs.find((c) => c.slug === params.slug);
    if (!club) throw notFound();
    const slug = encodeURIComponent(club.slug);
    const [games, { league, standings }, players] = await Promise.all([
      api.get<Game[]>(`/api/games?club=${slug}`),
      loadMainLeague(context.queryClient),
      api.get<Pick<Player, "id" | "name" | "nickname" | "position" | "photoUrl">[]>(
        `/api/clubs/${slug}/players`,
      ),
    ]);
    return { club, games, league, standings, players };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Clube não encontrado — Sábado à Tarde" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { club } = loaderData;
    const title = `${club.name} — AFPG Guimarães`;
    const description = `${club.name}${club.locality ? ` (${club.locality})` : ""}: classificação, resultados, próximo jogo e estatísticas na AFPG.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/clubes/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/clubes/${params.slug}` }],
    };
  },
  component: ClubPage,
});

function ClubPage() {
  const { club, games, league, standings, players } = Route.useLoaderData();
  const { season, clubBySlug } = useCatalog();
  useLiveRefresh(games.some(isLive));
  const stats = standings.find((r) => r.club === club.slug);
  const clubResults = games.filter(isPlayed).sort(byDateDesc);
  const next =
    games.find(isLive) ?? games.filter((m) => m.status === "scheduled").sort(byDateAsc)[0];
  const form = clubResults.slice(0, 5).map((m) => {
    const isHome = m.home === club.slug;
    const gf = (isHome ? m.homeGoals : m.awayGoals) ?? 0;
    const ga = (isHome ? m.awayGoals : m.homeGoals) ?? 0;
    return gf > ga ? "V" : gf === ga ? "E" : "D";
  });

  const statCards = stats
    ? [
        { label: "Posição", value: `${stats.position}º` },
        { label: "Jogos", value: stats.played },
        { label: "Vitórias", value: stats.wins },
        { label: "Empates", value: stats.draws },
        { label: "Derrotas", value: stats.losses },
        { label: "Golos marcados", value: stats.goalsFor },
        { label: "Golos sofridos", value: stats.goalsAgainst },
        { label: "Pontos", value: stats.points },
      ]
    : [];

  return (
    <div style={{ ["--club" as string]: club.color ?? "var(--primary)" }}>
      <section className="relative overflow-hidden border-b border-ink-border bg-ink text-ink-foreground">
        {club.wallpaperUrl && (
          <>
            <img
              src={club.wallpaperUrl}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-50"
            />
            {/* Keeps the name and stats readable on any image. */}
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/40" />
          </>
        )}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(120deg, color-mix(in oklab, var(--club) 70%, transparent), transparent 60%)",
          }}
        />
        <div className="container-afpg relative flex flex-col gap-8 py-14 md:flex-row md:items-center md:py-20">
          <Crest club={club} size="xl" className="animate-fade-up" />
          <div className="animate-fade-up">
            <p className="eyebrow text-primary">
              {[stats && league?.name, season && `Época ${season.name}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold uppercase leading-[0.95] md:text-6xl">
              {club.name}
            </h1>
            <p className="mt-4 text-ink-muted">
              {[club.locality, club.colorLabel].filter(Boolean).join(" · ")}
            </p>
            <AdminEditLink label="Editar clube" to="/admin/clubes" className="mt-5" />
            {form.length > 0 && (
              <div className="mt-6 flex items-center gap-2">
                <span className="eyebrow text-ink-muted">Forma</span>
                {form.map((f, i) => (
                  <span
                    key={i}
                    className={`stat inline-flex size-8 items-center justify-center rounded-md text-sm ${
                      f === "V"
                        ? "bg-primary text-primary-foreground"
                        : f === "E"
                          ? "bg-white/15 text-ink-foreground"
                          : "bg-destructive text-destructive-foreground"
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {statCards.length > 0 && (
        <section className="container-afpg py-14">
          <SectionTitle eyebrow="Época" title="Estatísticas" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card p-5 shadow-card"
              >
                <p className="stat text-4xl leading-none text-[var(--club)]">{s.value}</p>
                <p className="eyebrow mt-3 text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container-afpg grid gap-12 pb-14 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Calendário" title="Próximo jogo" />
          {next ? (
            <MatchCard match={next} />
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground">
              Sem jogo agendado publicado para este clube.
            </p>
          )}
        </div>
        <div>
          <SectionTitle eyebrow="Histórico recente" title="Últimos resultados" />
          {clubResults.length > 0 ? (
            <ul className="grid gap-3">
              {clubResults.map((m) => {
                const isHome = m.home === club.slug;
                const opponent = clubBySlug(isHome ? m.away : m.home);
                if (!opponent) return null;
                const gf = isHome ? m.homeGoals : m.awayGoals;
                const ga = isHome ? m.awayGoals : m.homeGoals;
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-card"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Crest club={opponent} size="xs" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {isHome ? "vs" : "@"} {opponent.shortName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {m.round} · {formatDate(m.date)}
                        </span>
                      </span>
                    </span>
                    <span className="stat text-2xl">
                      {gf}
                      <span className="mx-1 text-muted-foreground">—</span>
                      {ga}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground">
              Resultados por publicar.
            </p>
          )}
        </div>
      </section>

      {league && (
        <section className="container-afpg pb-8">
          <SectionTitle
            eyebrow={league ? leagueLabel(league) : undefined}
            title="Classificação"
            action={
              <Link to="/classificacoes" className="eyebrow text-primary hover:underline">
                Classificação completa →
              </Link>
            }
          />
          <StandingsTable rows={standings} />
        </section>
      )}

      <section className="container-afpg pb-4">
        <SectionTitle eyebrow="Época atual" title="Plantel" />
        {players.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card"
              >
                {p.photoUrl ? (
                  <img
                    src={p.photoUrl}
                    alt=""
                    loading="lazy"
                    className="size-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="stat flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {p.name.slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{p.nickname ?? p.name}</span>
                  <span className="eyebrow text-muted-foreground">
                    {p.position ? positionLabel[p.position] : "Jogador"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="max-w-2xl rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm leading-relaxed text-muted-foreground">
            O plantel do {club.shortName} ainda não foi publicado.
          </p>
        )}
      </section>
    </div>
  );
}
