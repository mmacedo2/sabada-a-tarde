import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import heroImg from "@/assets/hero-futebol.jpg";
import { PageHeader } from "@/components/site/PageHeader";

const photos = [
  { src: heroImg, caption: "Futebol popular em Guimarães", category: "Competições" },
];

export const Route = createFileRoute("/galeria")({
  head: () => ({
    meta: [
      { title: "Galeria — Sábado à Tarde" },
      {
        name: "description",
        content: "Fotografias do futebol popular de Guimarães: jogos, competições e momentos da AFPG.",
      },
      { property: "og:title", content: "Galeria — Sábado à Tarde" },
      { property: "og:description", content: "Fotografias dos jogos e competições da AFPG." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/galeria" },
    ],
    links: [{ rel: "canonical", href: "/galeria" }],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="Comunidade"
        title="Galeria"
        description="O futebol popular vive das pessoas. Esta galeria está preparada para receber as fotografias de cada jornada, competição e evento da AFPG."
      />

      <section className="container-afpg py-14 md:py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setOpen(i)}
              className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="block aspect-video overflow-hidden">
                <img
                  src={photo.src}
                  alt={photo.caption}
                  loading="lazy"
                  width={1920}
                  height={1088}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </span>
              <span className="block p-4">
                <span className="eyebrow block text-primary">{photo.category}</span>
                <span className="mt-1 block text-sm font-semibold">{photo.caption}</span>
              </span>
            </button>
          ))}
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
            Novas fotografias das jornadas e finais serão publicadas aqui.
          </div>
        </div>
      </section>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={photos[open]!.caption}
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-6"
        >
          <img
            src={photos[open]!.src}
            alt={photos[open]!.caption}
            className="max-h-[85vh] w-auto rounded-lg object-contain"
          />
          <button
            onClick={() => setOpen(null)}
            aria-label="Fechar imagem"
            className="absolute right-5 top-5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-white/20 text-ink-foreground"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
