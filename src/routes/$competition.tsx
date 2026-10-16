import { createFileRoute, notFound } from "@tanstack/react-router";

import { CompetitionPage } from "@/components/site/CompetitionPage";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { api, catalogQuery, isLive, type Doc, type Game, type StandingRow } from "@/lib/api";

// Top-level slug route (/super-liga, /taca-cidade-berco, ...): static routes win,
// so this only matches competition slugs and 404s on anything else.
export const Route = createFileRoute("/$competition")({
  loader: async ({ params, context }) => {
    const catalog = await context.queryClient.ensureQueryData(catalogQuery);
    const competition = catalog.competitions.find((c) => c.slug === params.competition);
    if (!competition) throw notFound();
    const slug = encodeURIComponent(competition.slug);
    const [games, standings, documents] = await Promise.all([
      api.get<Game[]>(`/api/games?competition=${slug}`),
      competition.kind === "league" ? api.get<StandingRow[]>(`/api/standings/${slug}`) : null,
      api.get<Doc[]>("/api/documents"),
    ]);
    return { competition, games, standings, documents };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData)
      return {
        meta: [
          { title: "Página não encontrada — Sábado à Tarde" },
          { name: "robots", content: "noindex" },
        ],
      };
    const { competition } = loaderData;
    const title = `${competition.name} — Sábado à Tarde`;
    const description =
      competition.description ?? `${competition.name}: classificação, resultados e calendário.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/${params.competition}` },
      ],
      links: [{ rel: "canonical", href: `/${params.competition}` }],
    };
  },
  component: CompetitionRoute,
});

function CompetitionRoute() {
  const data = Route.useLoaderData();
  useLiveRefresh(data.games.some(isLive));
  return <CompetitionPage {...data} />;
}
