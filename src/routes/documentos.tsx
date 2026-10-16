import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { DocumentList } from "@/components/site/DocumentList";
import { PageHeader } from "@/components/site/PageHeader";
import { docCategories, documents, type DocCategory } from "@/data/afpg";

export const Route = createFileRoute("/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos oficiais — Sábado à Tarde" },
      {
        name: "description",
        content:
          "Comunicados, Conselho de Disciplina, regulamentos, impressos AFPG e FFPN, secretaria e interconcelhias.",
      },
      { property: "og:title", content: "Documentos oficiais — Sábado à Tarde" },
      { property: "og:description", content: "Toda a documentação oficial da AFPG organizada por categoria." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/documentos" },
    ],
    links: [{ rel: "canonical", href: "/documentos" }],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const [category, setCategory] = useState<DocCategory | "Todas">("Todas");
  const docs =
    category === "Todas" ? documents : documents.filter((d) => d.category === category);

  return (
    <>
      <PageHeader
        eyebrow="Informação oficial"
        title="Documentos"
        description="Toda a documentação da Associação organizada por categoria: comunicados, disciplina, regulamentos, impressos e secretaria."
      />

      <section className="container-afpg py-14 md:py-16">
        <div className="mb-8 flex flex-wrap gap-2">
          {(["Todas", ...docCategories] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`eyebrow min-h-11 rounded-md border px-4 transition-colors ${
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <DocumentList docs={docs} />
      </section>
    </>
  );
}
