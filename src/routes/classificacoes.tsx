import { Link, createFileRoute } from "@tanstack/react-router";

import { DocumentList } from "@/components/site/DocumentList";
import { PageHeader, SectionTitle } from "@/components/site/PageHeader";
import { StandingsTable } from "@/components/site/StandingsTable";
import { SEASON, documents, superLigaStandings } from "@/data/afpg";

export const Route = createFileRoute("/classificacoes")({
  head: () => ({
    meta: [
      { title: "Classificações — Sábado à Tarde" },
      {
        name: "description",
        content:
          "Classificação da Super Liga 1ª Divisão AFPG e classificação disciplinar da época 2025/2026.",
      },
      { property: "og:title", content: "Classificações — Sábado à Tarde" },
      { property: "og:description", content: "Classificação da Super Liga e Taça de Disciplina da AFPG." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/classificacoes" },
    ],
    links: [{ rel: "canonical", href: "/classificacoes" }],
  }),
  component: StandingsPage,
});

function StandingsPage() {
  const disciplineDocs = documents.filter((d) => d.category === "Taça de Disciplina");
  const prizeDocs = documents.filter((d) => d.category === "Prémios");

  return (
    <>
      <PageHeader
        eyebrow={`Época ${SEASON}`}
        title="Classificações"
        description="Classificação final da Super Liga 1ª Divisão, classificação disciplinar e prémios individuais."
      />

      <section className="container-afpg py-14 md:py-16">
        <SectionTitle
          eyebrow="Super Liga · 1ª Divisão"
          title="Classificação final"
          action={
            <Link to="/super-liga" className="eyebrow text-primary hover:underline">
              Página da competição →
            </Link>
          }
        />
        <StandingsTable rows={superLigaStandings} />

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle eyebrow="Fair play" title="Taça de Disciplina" />
            <DocumentList docs={disciplineDocs} />
          </div>
          <div>
            <SectionTitle eyebrow="Prémios individuais" title="Melhor marcador e melhor jogador" />
            <DocumentList docs={prizeDocs} />
          </div>
        </div>
      </section>
    </>
  );
}
