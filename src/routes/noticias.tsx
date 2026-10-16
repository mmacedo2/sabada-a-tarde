import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionTitle } from "@/components/site/PageHeader";
import { documents } from "@/data/afpg";

export const Route = createFileRoute("/noticias")({
  head: () => ({
    meta: [
      { title: "Notícias e comunicados — Sábado à Tarde" },
      {
        name: "description",
        content:
          "Comunicados oficiais, decisões do Conselho de Disciplina e informação da Associação de Futebol Popular de Guimarães.",
      },
      { property: "og:title", content: "Notícias e comunicados — Sábado à Tarde" },
      { property: "og:description", content: "Informação oficial da AFPG e do Conselho de Disciplina." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/noticias" },
    ],
    links: [{ rel: "canonical", href: "/noticias" }],
  }),
  component: NewsPage,
});

function NewsPage() {
  const featured = documents.filter(
    (d) =>
      d.category === "Comunicados" ||
      d.category === "Conselho de Disciplina" ||
      d.category === "Prémios" ||
      d.category === "Super Liga",
  );

  return (
    <>
      <PageHeader
        eyebrow="Sala de imprensa"
        title="Notícias e comunicados"
        description="A AFPG publica a sua informação através de comunicados e documentos oficiais. Aqui estão reunidos, por ordem de importância, com acesso direto."
      />

      <section className="container-afpg py-14 md:py-16">
        <SectionTitle eyebrow="Publicações oficiais" title="Últimas publicações" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((doc) => (
            <a
              key={doc.url + doc.title}
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <div>
                <p className="eyebrow text-primary">{doc.category}</p>
                <h2 className="mt-3 font-display text-lg font-bold leading-snug">{doc.title}</h2>
              </div>
              <p className="eyebrow mt-6 text-muted-foreground transition-colors group-hover:text-primary">
                Abrir →
              </p>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
