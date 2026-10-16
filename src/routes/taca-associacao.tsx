import { createFileRoute } from "@tanstack/react-router";

import { CompetitionPage } from "@/components/site/CompetitionPage";
import { competitionBySlug } from "@/data/afpg";

const competition = competitionBySlug("taca-associacao")!;

export const Route = createFileRoute("/taca-associacao")({
  head: () => ({
    meta: [
      { title: "Taça Associação — Sábado à Tarde" },
      {
        name: "description",
        content:
          "Taça Associação da AFPG: eliminatórias, calendário, equipas participantes e documentos oficiais.",
      },
      { property: "og:title", content: "Taça Associação — Sábado à Tarde" },
      { property: "og:description", content: "Eliminatórias e calendário da Taça Associação AFPG." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/taca-associacao" },
    ],
    links: [{ rel: "canonical", href: "/taca-associacao" }],
  }),
  component: () => <CompetitionPage competition={competition} />,
});
