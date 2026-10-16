import { createFileRoute } from "@tanstack/react-router";

import { CompetitionPage } from "@/components/site/CompetitionPage";
import { competitionBySlug } from "@/data/afpg";

const competition = competitionBySlug("taca-cidade-berco")!;

export const Route = createFileRoute("/taca-cidade-berco")({
  head: () => ({
    meta: [
      { title: "Taça Cidade Berço — Sábado à Tarde" },
      {
        name: "description",
        content:
          "Taça Cidade Berço 2025/2026: quartos de final, meias-finais e final. Calendário e resultados oficiais da AFPG.",
      },
      { property: "og:title", content: "Taça Cidade Berço — Sábado à Tarde" },
      { property: "og:description", content: "Quartos, meias-finais e final da Taça Cidade Berço." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/taca-cidade-berco" },
    ],
    links: [{ rel: "canonical", href: "/taca-cidade-berco" }],
  }),
  component: () => <CompetitionPage competition={competition} />,
});
