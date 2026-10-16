import { createFileRoute } from "@tanstack/react-router";

import { CompetitionPage } from "@/components/site/CompetitionPage";
import { competitionBySlug } from "@/data/afpg";

const competition = competitionBySlug("trofeu-joao-fernandes")!;

export const Route = createFileRoute("/trofeu-joao-fernandes")({
  head: () => ({
    meta: [
      { title: "Troféu João Fernandes — Sábado à Tarde" },
      {
        name: "description",
        content:
          "Troféu João Fernandes 2026: o jogo que abre a época do futebol popular de Guimarães e premeia o fair play.",
      },
      { property: "og:title", content: "Troféu João Fernandes — Sábado à Tarde" },
      { property: "og:description", content: "Pinheiro venceu o Atlético Costa por 3-1 no arranque da época." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/trofeu-joao-fernandes" },
    ],
    links: [{ rel: "canonical", href: "/trofeu-joao-fernandes" }],
  }),
  component: () => <CompetitionPage competition={competition} />,
});
