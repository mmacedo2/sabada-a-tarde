import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { Crest } from "@/components/site/Crest";
import { MatchCard } from "@/components/site/MatchCard";
import { SectionTitle } from "@/components/site/PageHeader";
import { StandingsTable } from "@/components/site/StandingsTable";
import {
  SEASON,
  clubBySlug,
  clubForm,
  clubStats,
  formatDate,
  results,
  superLigaStandings,
  upcoming,
} from "@/data/afpg";

export const Route = createFileRoute("/clubes/$slug")({
  loader: ({ params }) => {
    const club = clubBySlug(params.slug);
    if (!club) throw notFound();
    return { club };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Clube não encontrado — Sábado à Tarde" }, { name: "robots", content: "noindex" }],
      };
    }
    const { club } = loaderData;
    const title = `${club.name} — AFPG Guimarães`;
    const description = `${club.name} (${club.locality}): classificação, resultados, próximo jogo e estatísticas na AFPG, época ${SEASON}.`;
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
  const { club } = Route.useLoaderData();
  const stats = clubStats(club.slug);
  const form = clubForm(club.slug);
  const clubResults = results.filter((m) => m.home === club.slug || m.away === club.slug);
  const next = upcoming.find((m) => m.home === club.slug || m.away === club.slug);

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
    <div style={{ ["--club" as string]: club.color }}>
      <section className="relative border-b border-ink-border bg-ink text-ink-foreground">
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
            <p className="eyebrow text-primary">Super Liga · Época {SEASON}</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold uppercase leading-[0.95] md:text-6xl">
              {club.name}
            </h1>
            <p className="mt-4 text-ink-muted">
              {club.locality} · {club.colorLabel}
            </p>
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
                const opponent = clubBySlug(isHome ? m.away : m.home)!;
                const gf = isHome ? m.homeGoals! : m.awayGoals!;
                const ga = isHome ? m.awayGoals! : m.homeGoals!;
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-card"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Crest club={opponent} size="xs" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {isHome ? "vs" : "@"} {opponent.short}
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

      <section className="container-afpg pb-8">
        <SectionTitle
          eyebrow="Super Liga · 1ª Divisão"
          title="Classificação"
          action={
            <Link to="/classificacoes" className="eyebrow text-primary hover:underline">
              Classificação completa →
            </Link>
          }
        />
        <StandingsTable rows={superLigaStandings} />
      </section>

      <section className="container-afpg pb-4">
        <SectionTitle eyebrow="Sobre o clube" title="Plantel e história" />
        <p className="max-w-2xl rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm leading-relaxed text-muted-foreground">
          A AFPG não publica atualmente plantel ou histórico do {club.short} nos seus documentos
          oficiais. Esta secção está preparada para receber essa informação assim que for
          disponibilizada pelo clube ou pela Associação.
        </p>
      </section>
    </div>
  );
}
