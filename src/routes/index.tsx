import { Link, createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/hero-futebol.jpg";
import { Crest } from "@/components/site/Crest";
import { MatchCard } from "@/components/site/MatchCard";
import { SectionTitle } from "@/components/site/PageHeader";
import { StandingsTable } from "@/components/site/StandingsTable";
import { formatDateTime } from "@/data/afpg";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import {
  api,
  byDateAsc,
  byDateDesc,
  isLive,
  isPlayed,
  type ArticleSummary,
  type Doc,
  type Game,
  competitionKindLabel,
  leagueLabel,
  loadMainLeague,
} from "@/lib/api";
import { useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const [games, { league, standings }, articles, documents] = await Promise.all([
      api.get<Game[]>("/api/games"),
      loadMainLeague(context.queryClient),
      api.get<ArticleSummary[]>("/api/articles?limit=3"),
      api.get<Doc[]>("/api/documents"),
    ]);
    return { games, league, standings, articles, documents };
  },
  head: () => ({
    meta: [
      { title: "Sábado à Tarde — Futebol Popular de Guimarães" },
      {
        name: "description",
        content:
          "Resultados, classificações, competições e clubes do futebol popular de Guimarães. Super Liga, Taça Associação, Taça Cidade Berço e Taça de Disciplina.",
      },
      { property: "og:title", content: "Sábado à Tarde — Futebol Popular de Guimarães" },
      {
        property: "og:description",
        content:
          "Paixão, competição e comunidade. A plataforma dos adeptos do futebol popular de Guimarães.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const { games, league, standings, articles, documents } = Route.useLoaderData();
  const { season, clubs, competitions } = useCatalog();
  const live = games.filter(isLive);
  useLiveRefresh(live.length > 0);

  const results = games.filter(isPlayed).sort(byDateDesc);
  const lastRound = results[0]?.round;
  const lastResults = results.filter((m) => m.round === lastRound);
  const upcoming = games
    .filter((g) => g.status === "scheduled")
    .sort(byDateAsc)
    .slice(0, 6);
  const comunicados = documents.slice(0, 6);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        <img
          src={heroImg}
          alt="Jogo de futebol popular em Guimarães ao final da tarde"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/40 lg:bg-gradient-to-r" />
        <div className="container-afpg relative py-12 md:py-16 lg:py-20">
          <div className="animate-fade-up">
            <p className="eyebrow text-primary">
              Futebol Popular de Guimarães{season && ` · Época ${season.name}`}
            </p>
            <h1 className="mt-3 font-display text-3xl font-extrabold uppercase leading-none sm:text-4xl lg:text-5xl">
              Sábado à Tarde
            </h1>
            <p className="mt-4 max-w-md text-base text-ink-muted">
              Jogos, resultados e classificações do futebol popular de Guimarães, feito por e para
              os adeptos.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/classificacoes"
                className="eyebrow inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-primary-foreground transition-colors hover:bg-primary-deep"
              >
                Ver classificações
              </Link>
              <Link
                to="/resultados"
                className="eyebrow inline-flex min-h-11 items-center rounded-md border border-white/25 px-5 text-ink-foreground transition-colors hover:bg-white/10"
              >
                Ver resultados
              </Link>
            </div>
          </div>
        </div>
      </section>

      {live.length > 0 && (
        <section className="container-afpg pt-16 md:pt-20">
          <SectionTitle eyebrow="A decorrer" title="Jogos ao vivo" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {live.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* RESULTADOS RECENTES */}
      <section className="container-afpg py-16 md:py-20">
        <SectionTitle
          eyebrow={lastRound}
          title="Resultados recentes"
          action={
            <Link to="/resultados" className="eyebrow text-primary hover:underline">
              Todos os resultados →
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lastResults.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>

      {/* PRÓXIMOS JOGOS + CLASSIFICAÇÃO */}
      <section className="container-afpg grid gap-12 pb-16 md:pb-20 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <SectionTitle eyebrow="Calendário" title="Próximos jogos" />
          {upcoming.length > 0 ? (
            <div className="grid gap-4">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground">
              Sem jogos agendados publicados. Consulte os calendários em Documentos.
            </p>
          )}
        </div>
        {league && (
          <div>
            <SectionTitle
              eyebrow={leagueLabel(league)}
              title="Classificação"
              action={
                <Link
                  to="/$competition"
                  params={{ competition: league.slug }}
                  className="eyebrow text-primary hover:underline"
                >
                  Competição →
                </Link>
              }
            />
            <StandingsTable rows={standings} compact />
          </div>
        )}
      </section>

      {/* COMPETIÇÕES */}
      <section className="bg-ink py-16 text-ink-foreground md:py-20">
        <div className="container-afpg">
          <div className="mb-8">
            <p className="eyebrow text-primary">O que se joga ao sábado</p>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold uppercase md:text-3xl">
              Competições
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {competitions.map((c) => (
              <Link
                key={c.slug}
                to="/$competition"
                params={{ competition: c.slug }}
                className="group flex flex-col rounded-xl border border-ink-border bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:bg-white/[0.06]"
              >
                {c.logoUrl && (
                  <img
                    src={c.logoUrl}
                    alt={`Símbolo da ${c.name}`}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="h-24 w-auto self-start object-contain brightness-0 invert transition-transform group-hover:scale-105"
                  />
                )}
                <p className="eyebrow mt-6 text-primary">{competitionKindLabel[c.kind]}</p>
                <h3 className="mt-1 font-display text-xl font-extrabold uppercase">{c.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{c.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CLUBES */}
      <section className="container-afpg py-16 md:py-20">
        <SectionTitle
          eyebrow="Filiados"
          title="Clubes"
          action={
            <Link to="/clubes" className="eyebrow text-primary hover:underline">
              Todas as equipas →
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {clubs.map((club) => (
            <Link
              key={club.slug}
              to="/clubes/$slug"
              params={{ slug: club.slug }}
              className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <Crest club={club} size="lg" className="transition-transform group-hover:scale-105" />
              <h3 className="mt-4 text-sm font-bold leading-tight">{club.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{club.locality}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* NOTÍCIAS */}
      {articles.length > 0 && (
        <section className="container-afpg pb-16 md:pb-20">
          <SectionTitle
            eyebrow="Sala de imprensa"
            title="Últimas notícias"
            action={
              <Link to="/noticias" className="eyebrow text-primary hover:underline">
                Todas as notícias →
              </Link>
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                to="/noticias/$slug"
                params={{ slug: a.slug }}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
              >
                {a.coverUrl && (
                  <img
                    src={a.coverUrl}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-6">
                  <p className="eyebrow text-primary">{formatDateTime(a.publishedAt)}</p>
                  <h3 className="mt-3 font-display text-lg font-bold leading-snug">{a.title}</h3>
                  {a.summary && <p className="mt-2 text-sm text-muted-foreground">{a.summary}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* COMUNICADOS */}
      {comunicados.length > 0 && (
        <section className="container-afpg pb-4">
          <SectionTitle
            eyebrow="Informação oficial"
            title="Documentos da Associação"
            action={
              <Link to="/documentos" className="eyebrow text-primary hover:underline">
                Todos os documentos →
              </Link>
            }
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comunicados.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
              >
                <div>
                  <p className="eyebrow text-primary">{doc.category}</p>
                  <h3 className="mt-3 font-display text-lg font-bold leading-snug">{doc.title}</h3>
                </div>
                <p className="eyebrow mt-6 text-muted-foreground transition-colors group-hover:text-primary">
                  Abrir documento →
                </p>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
