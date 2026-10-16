import { Link, createFileRoute } from "@tanstack/react-router";

import { DocumentList } from "@/components/site/DocumentList";
import { PageHeader, SectionTitle } from "@/components/site/PageHeader";
import { StandingsTable } from "@/components/site/StandingsTable";
import { api, leagueLabel, loadMainLeague, type Doc } from "@/lib/api";
import { useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/classificacoes")({
  loader: async ({ context }) => {
    const [{ league, standings }, documents] = await Promise.all([
      loadMainLeague(context.queryClient),
      api.get<Doc[]>("/api/documents"),
    ]);
    return { league, standings, documents };
  },
  head: () => ({
    meta: [
      { title: "Classificações — Sábado à Tarde" },
      {
        name: "description",
        content: "Classificação da Super Liga 1ª Divisão AFPG e classificação disciplinar.",
      },
      { property: "og:title", content: "Classificações — Sábado à Tarde" },
      {
        property: "og:description",
        content: "Classificação da Super Liga e Taça de Disciplina da AFPG.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/classificacoes" },
    ],
    links: [{ rel: "canonical", href: "/classificacoes" }],
  }),
  component: StandingsPage,
});

function StandingsPage() {
  const { league, standings, documents } = Route.useLoaderData();
  const { season } = useCatalog();
  const disciplineDocs = documents.filter((d) => d.category === "Taça de Disciplina");
  const prizeDocs = documents.filter((d) => d.category === "Prémios");

  return (
    <>
      <PageHeader
        eyebrow={season ? `Época ${season.name}` : undefined}
        title="Classificações"
        description="Classificação do campeonato, classificação disciplinar e prémios individuais."
      />

      <section className="container-afpg py-14 md:py-16">
        {league && (
          <>
            <SectionTitle
              eyebrow={leagueLabel(league)}
              title="Classificação"
              action={
                <Link
                  to="/$competition"
                  params={{ competition: league.slug }}
                  className="eyebrow text-primary hover:underline"
                >
                  Página da competição →
                </Link>
              }
            />
            <StandingsTable rows={standings} />
          </>
        )}

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
