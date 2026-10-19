import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { AdminEditLink } from "@/components/site/AdminEditLink";
import { formatDateTime } from "@/data/afpg";
import { ApiError, api, type Article } from "@/lib/api";

export const Route = createFileRoute("/noticias/$slug")({
  loader: async ({ params }) => {
    try {
      return await api.get<Article>(`/api/articles/${encodeURIComponent(params.slug)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    }
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Notícia não encontrada — Sábado à Tarde" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.title} — Sábado à Tarde`;
    const description = loaderData.summary ?? loaderData.body.slice(0, 160);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/noticias/${params.slug}` },
        ...(loaderData.coverUrl ? [{ property: "og:image", content: loaderData.coverUrl }] : []),
        { property: "article:published_time", content: loaderData.publishedAt },
      ],
      links: [{ rel: "canonical", href: `/noticias/${params.slug}` }],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const article = Route.useLoaderData();
  // Plain text: blank lines separate paragraphs. Rendered as text, never as HTML.
  const paragraphs = article.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article>
      <header className="border-b border-ink-border bg-ink text-ink-foreground">
        <div className="container-afpg max-w-3xl py-14 md:py-20">
          <Link to="/noticias" className="eyebrow text-primary hover:underline">
            ← Notícias
          </Link>
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight md:text-5xl">
            {article.title}
          </h1>
          {article.summary && (
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">{article.summary}</p>
          )}
          <p className="eyebrow mt-6 text-ink-muted">
            {formatDateTime(article.publishedAt)}
            {article.authorName && ` · ${article.authorName}`}
          </p>
          <AdminEditLink
            label="Editar notícia"
            to="/admin/noticias/$id"
            params={{ id: String(article.id) }}
            className="mt-6"
          />
        </div>
      </header>

      <div className="container-afpg max-w-3xl py-12">
        {article.coverUrl && (
          <img
            src={article.coverUrl}
            alt=""
            className="mb-10 w-full rounded-xl object-cover shadow-card"
          />
        )}
        <div className="space-y-5 text-lg leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
