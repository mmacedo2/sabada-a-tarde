import { useState } from "react";

import { Crest } from "@/components/site/Crest";
import { DocumentList } from "@/components/site/DocumentList";
import { MatchCard } from "@/components/site/MatchCard";
import { PageHeader, SectionTitle } from "@/components/site/PageHeader";
import { StandingsTable } from "@/components/site/StandingsTable";
import { formatDate } from "@/data/afpg";
import {
  byDateAsc,
  byDateDesc,
  competitionKindLabel,
  isPlayed,
  type Competition,
  type Doc,
  type Game,
  type StandingRow,
} from "@/lib/api";
import { useCatalog } from "@/lib/catalog";

const tabs = ["Classificação", "Resultados", "Calendário", "Equipas", "Documentos"] as const;
type Tab = (typeof tabs)[number];

export function CompetitionPage({
  competition,
  games,
  standings,
  documents,
}: {
  competition: Competition;
  games: Game[];
  standings: StandingRow[] | null;
  documents: Doc[];
}) {
  const { season, clubs, clubBySlug } = useCatalog();
  const [tab, setTab] = useState<Tab>(standings ? "Classificação" : "Calendário");

  const results = games.filter((g) => isPlayed(g)).sort(byDateDesc);
  const upcoming = games.filter((g) => !isPlayed(g)).sort(byDateAsc);
  const teams = clubs.filter((c) => games.some((g) => g.home === c.slug || g.away === c.slug));
  const ownDocs = documents.filter((d) => d.category === competition.name);
  const docs =
    ownDocs.length > 0 ? ownDocs : documents.filter((d) => d.category === "Regulamentos");

  // Cups: one card per round, in date order, including ties still to be decided.
  const rounds = competition.kind === "league" ? [] : groupByRound([...games].sort(byDateAsc));

  return (
    <>
      <PageHeader
        eyebrow={`${competitionKindLabel[competition.kind]}${season ? ` · Época ${season.name}` : ""}`}
        title={competition.name}
        description={competition.description ?? undefined}
        mark={competition.logoUrl ?? undefined}
      />

      <div className="border-b border-border bg-card/60 backdrop-blur">
        <div className="container-afpg flex gap-1 overflow-x-auto py-3" role="tablist">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`eyebrow shrink-0 rounded-md px-4 py-2.5 transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <section className="container-afpg py-14 md:py-16">
        {tab === "Classificação" &&
          (standings ? (
            <>
              <SectionTitle eyebrow="Classificação" title={competition.name} />
              <StandingsTable rows={standings} />
              <LeagueHighlights rows={standings} />
            </>
          ) : (
            <Placeholder text="Esta competição é disputada por eliminatórias — consulte o Calendário e os Resultados." />
          ))}

        {tab === "Resultados" && (
          <>
            <SectionTitle eyebrow="Jogos realizados" title="Resultados" />
            {results.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <Placeholder text="Ainda não há resultados nesta competição." />
            )}
          </>
        )}

        {tab === "Calendário" && (
          <>
            <SectionTitle eyebrow="Programação" title="Calendário" />
            {rounds.length > 0 ? (
              <div className="grid gap-6">
                {rounds.map(({ round, date, games: ties }) => (
                  <div
                    key={round}
                    className="rounded-xl border border-border bg-card p-6 shadow-card"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-display text-lg font-extrabold uppercase">{round}</h3>
                      <p className="eyebrow text-muted-foreground">{formatDate(date)}</p>
                    </div>
                    <ul className="mt-4 grid gap-2">
                      {ties.map((tie) => {
                        const home = clubBySlug(tie.home);
                        const away = clubBySlug(tie.away);
                        return (
                          <li
                            key={tie.id}
                            className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/60 px-4 py-3 text-sm"
                          >
                            {home && <Crest club={home} size="xs" />}
                            <span className="font-semibold">
                              {home?.shortName ?? tie.homePlaceholder}
                            </span>
                            <span className="eyebrow text-muted-foreground">
                              {isPlayed(tie) ? `${tie.homeGoals} – ${tie.awayGoals}` : "vs"}
                            </span>
                            {away && <Crest club={away} size="xs" />}
                            <span className="font-semibold">
                              {away?.shortName ?? tie.awayPlaceholder ?? "—"}
                            </span>
                            {tie.stage && (
                              <span className="eyebrow ml-auto text-primary">{tie.stage}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : upcoming.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <Placeholder text="Sem jogos agendados — consulte o separador Documentos." />
            )}
          </>
        )}

        {tab === "Equipas" && (
          <>
            <SectionTitle eyebrow="Participantes" title="Equipas" />
            {teams.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {teams.map((club) => (
                  <div
                    key={club.slug}
                    className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-card"
                  >
                    <Crest club={club} size="lg" />
                    <p className="mt-4 text-sm font-bold leading-tight">{club.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{club.locality}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Placeholder text="Equipas por definir." />
            )}
          </>
        )}

        {tab === "Documentos" && (
          <>
            <SectionTitle eyebrow="Informação oficial" title="Documentos" />
            <DocumentList docs={docs} />
          </>
        )}
      </section>
    </>
  );
}

function groupByRound(games: Game[]) {
  const rounds = new Map<string, { round: string; date: string; games: Game[] }>();
  for (const g of games) {
    const entry = rounds.get(g.round) ?? { round: g.round, date: g.date, games: [] };
    entry.games.push(g);
    rounds.set(g.round, entry);
  }
  return [...rounds.values()];
}

function LeagueHighlights({ rows }: { rows: StandingRow[] }) {
  const { clubBySlug } = useCatalog();
  const leader = rows[0];
  if (!leader || leader.played === 0) return null;
  const attack = rows.reduce((best, r) => (r.goalsFor > best.goalsFor ? r : best));
  const defence = rows
    .filter((r) => r.played > 0)
    .reduce((best, r) => (r.goalsAgainst < best.goalsAgainst ? r : best));
  const name = (slug: string) => clubBySlug(slug)?.shortName ?? slug;
  const cards = [
    { label: "Líder", value: `${name(leader.club)} · ${leader.points} pts` },
    { label: "Melhor ataque", value: `${name(attack.club)} · ${attack.goalsFor} golos` },
    { label: "Melhor defesa", value: `${name(defence.club)} · ${defence.goalsAgainst} sofridos` },
  ];
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      {cards.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="eyebrow text-primary">{s.label}</p>
          <p className="mt-2 font-display text-lg font-bold">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

export function Placeholder({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground">
      {text}
    </p>
  );
}
