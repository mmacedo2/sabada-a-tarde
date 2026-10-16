import { useState } from "react";

import { Crest } from "@/components/site/Crest";
import { DocumentList } from "@/components/site/DocumentList";
import { MatchCard } from "@/components/site/MatchCard";
import { PageHeader, SectionTitle } from "@/components/site/PageHeader";
import { StandingsTable } from "@/components/site/StandingsTable";
import {
  SEASON,
  clubBySlug,
  clubs,
  documents,
  formatDate,
  matches,
  superLigaStandings,
  cupBrackets,
  type Competition,
} from "@/data/afpg";

const tabs = ["Classificação", "Resultados", "Calendário", "Equipas", "Documentos"] as const;
type Tab = (typeof tabs)[number];

export function CompetitionPage({ competition }: { competition: Competition }) {
  const [tab, setTab] = useState<Tab>(
    competition.slug === "super-liga" ? "Classificação" : "Calendário",
  );

  const compMatches = matches.filter((m) => m.competition === competition.slug);
  const compResults = compMatches.filter((m) => m.homeGoals !== undefined);
  const compUpcoming = compMatches.filter((m) => m.homeGoals === undefined);
  const docs = documents.filter((d) =>
    competition.slug === "super-liga"
      ? d.category === "Super Liga"
      : competition.slug === "taca-cidade-berco"
        ? d.category === "Taça Cidade Berço"
        : competition.slug === "taca-disciplina"
          ? d.category === "Taça de Disciplina"
          : d.category === "Regulamentos",
  );

  const hasStandings = competition.slug === "super-liga";

  return (
    <>
      <PageHeader
        eyebrow={`${competition.kind} · Época ${SEASON}`}
        title={competition.name}
        description={competition.description}
        mark={competition.mark}
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
          (hasStandings ? (
            <>
              <SectionTitle eyebrow="Classificação final" title="Super Liga 1ª Divisão" />
              <StandingsTable rows={superLigaStandings} />
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Melhor ataque", value: "Atlético Costa · 35 golos" },
                  { label: "Melhor defesa", value: "Atlético Costa · 11 golos" },
                  { label: "Campeão", value: "C. Atlético Costa · 32 pts" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <p className="eyebrow text-primary">{s.label}</p>
                    <p className="mt-2 font-display text-lg font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Placeholder text="Esta competição é disputada por eliminatórias — consulte o Calendário e os Resultados." />
          ))}

        {tab === "Resultados" && (
          <>
            <SectionTitle eyebrow="Boletins oficiais" title="Resultados" />
            {compResults.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {compResults.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <Placeholder text="Resultados desta competição publicados apenas em documento oficial — ver o separador Documentos." />
            )}
          </>
        )}

        {tab === "Calendário" && (
          <>
            <SectionTitle eyebrow="Programação" title="Calendário" />
            {cupBrackets[competition.slug] ? (
              <div className="grid gap-6">
                {cupBrackets[competition.slug]!.map((stage) => (
                  <div key={stage.stage} className="rounded-xl border border-border bg-card p-6 shadow-card">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-display text-lg font-extrabold uppercase">{stage.stage}</h3>
                      <p className="eyebrow text-muted-foreground">{formatDate(stage.date)}</p>
                    </div>
                    {stage.ties.length > 0 ? (
                      <ul className="mt-4 grid gap-2">
                        {stage.ties.map((tie, i) => {
                          const home = tie.home ? clubBySlug(tie.home) : null;
                          const away = tie.away ? clubBySlug(tie.away) : null;
                          return (
                            <li
                              key={i}
                              className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/60 px-4 py-3 text-sm"
                            >
                              {home && <Crest club={home} size="xs" />}
                              <span className="font-semibold">{home?.short ?? tie.homeLabel}</span>
                              <span className="eyebrow text-muted-foreground">vs</span>
                              {away && <Crest club={away} size="xs" />}
                              <span className="font-semibold">{away?.short ?? tie.awayLabel ?? "—"}</span>
                              {tie.note && (
                                <span className="eyebrow ml-auto text-primary">{tie.note}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">
                        Emparelhamentos disponíveis no calendário oficial em PDF.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : compUpcoming.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {compUpcoming.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <Placeholder text="Calendário publicado em documento oficial — ver o separador Documentos." />
            )}
          </>
        )}

        {tab === "Equipas" && (
          <>
            <SectionTitle eyebrow="Participantes" title="Equipas" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {clubs.map((club) => (
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

function Placeholder({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground">
      {text}
    </p>
  );
}
