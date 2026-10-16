import { createFileRoute } from "@tanstack/react-router";

import { CompetitionPage } from "@/components/site/CompetitionPage";
import { competitionBySlug } from "@/data/afpg";

const competition = competitionBySlug("super-liga")!;

export const Route = createFileRoute("/super-liga")({
  head: () => ({
    meta: [
      { title: "Super Liga — Sábado à Tarde · Classificação e resultados" },
      {
        name: "description",
        content:
          "Super Liga 1ª Divisão AFPG: classificação, resultados jornada a jornada, calendário e equipas participantes.",
      },
      { property: "og:title", content: "Super Liga — Sábado à Tarde" },
      { property: "og:description", content: "Classificação e resultados da Super Liga 1ª Divisão AFPG." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/super-liga" },
    ],
    links: [{ rel: "canonical", href: "/super-liga" }],
  }),
  component: () => <CompetitionPage competition={competition} />,
});
