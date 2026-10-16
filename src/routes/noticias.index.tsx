import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/site/PageHeader";
import { formatDateTime } from "@/data/afpg";
import { ApiError, api, type ArticleKind, type ArticleSummary } from "@/lib/api";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/noticias/")({
  loader: () => api.get<ArticleSummary[]>(`/api/articles?limit=${PAGE_SIZE}`),
  head: () => ({
    meta: [
      { title: "Notícias e comunicados — Sábado à Tarde" },
      {
        name: "description",
        content: "Notícias, crónicas de jogo e comunicados do futebol popular de Guimarães.",
      },
      { property: "og:title", content: "Notícias e comunicados — Sábado à Tarde" },
      {
        property: "og:description",
        content: "Notícias e comunicados do futebol popular de Guimarães.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/noticias" },
    ],
    links: [{ rel: "canonical", href: "/noticias" }],
  }),
  component: NewsPage,
});

const kindLabel: Record<ArticleKind, string> = { news: "Notícia", announcement: "Comunicado" };

function NewsPage() {
  const firstPage = Route.useLoaderData();
  const [more, setMore] = useState<ArticleSummary[]>([]);
  const [hasMore, setHasMore] = useState(firstPage.length === PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const articles = [...firstPage, ...more];

  async function loadMore() {
    const last = articles.at(-1);
    if (!last) return;
    setLoading(true);
    setError(null);
    try {
      const page = await api.get<ArticleSummary[]>(
        `/api/articles?limit=${PAGE_SIZE}&before=${encodeURIComponent(last.publishedAt)}`,
      );
      setMore((m) => [...m, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível carregar mais notícias.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Sala de imprensa"
        title="Notícias e comunicados"
        description="Crónicas, entrevistas, transferências e comunicados do futebol popular de Guimarães."
      />

      <section className="container-afpg py-14 md:py-16">
        {articles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground">
            Ainda não há notícias publicadas.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                to="/noticias/$slug"
                params={{ slug: a.slug }}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
              >
                {a.coverUrl && (
                  <img
                    src={a.coverUrl}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-6">
                  <p className="eyebrow text-primary">
                    {kindLabel[a.kind]} · {formatDateTime(a.publishedAt)}
                  </p>
                  <h2 className="mt-3 font-display text-lg font-bold leading-snug">{a.title}</h2>
                  {a.summary && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {a.summary}
                    </p>
                  )}
                  <p className="eyebrow mt-auto pt-6 text-muted-foreground transition-colors group-hover:text-primary">
                    Ler →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className="eyebrow inline-flex min-h-12 items-center rounded-md border border-border px-6 transition-colors hover:border-primary/50 disabled:opacity-60"
            >
              {loading ? "A carregar…" : "Mais notícias"}
            </button>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </div>
        )}
      </section>
    </>
  );
}
