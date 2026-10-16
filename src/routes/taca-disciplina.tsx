import { createFileRoute } from "@tanstack/react-router";

import { CompetitionPage } from "@/components/site/CompetitionPage";
import { competitionBySlug } from "@/data/afpg";

const competition = competitionBySlug("taca-disciplina")!;

export const Route = createFileRoute("/taca-disciplina")({
  head: () => ({
    meta: [
      { title: "Taça de Disciplina — Sábado à Tarde" },
      {
        name: "description",
        content:
          "Taça de Disciplina AFPG: classificação disciplinar jornada a jornada e documentos oficiais de fair play.",
      },
      { property: "og:title", content: "Taça de Disciplina — Sábado à Tarde" },
      { property: "og:description", content: "Classificação disciplinar da AFPG, jornada a jornada." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/taca-disciplina" },
    ],
    links: [{ rel: "canonical", href: "/taca-disciplina" }],
  }),
  component: () => <CompetitionPage competition={competition} />,
});
