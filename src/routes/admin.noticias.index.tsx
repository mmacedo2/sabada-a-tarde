import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { AdminSection, Empty, QueryState } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/data/afpg";
import { adminQueries } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin/noticias/")({ component: ArticlesAdmin });

function ArticlesAdmin() {
  const articles = useQuery(adminQueries.articles);
  const now = new Date().toISOString();

  return (
    <AdminSection
      title="Notícias"
      actions={
        <Button asChild>
          <Link to="/admin/noticias/$id" params={{ id: "nova" }}>
            Nova notícia
          </Link>
        </Button>
      }
    >
      <QueryState isLoading={articles.isLoading} error={articles.error} />
      {articles.data?.length === 0 && <Empty>Ainda não há notícias.</Empty>}
      <ul className="grid gap-2">
        {articles.data?.map((a) => {
          const state =
            a.status === "draft"
              ? "Rascunho"
              : a.publishedAt && a.publishedAt > now
                ? `Agendada · ${formatDateTime(a.publishedAt)}`
                : `Publicada · ${formatDateTime(a.publishedAt!)}`;
          return (
            <li key={a.id}>
              <Link
                to="/admin/noticias/$id"
                params={{ id: String(a.id) }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm hover:bg-muted"
              >
                <span className="font-semibold">{a.title}</span>
                <span className="text-muted-foreground">
                  {a.kind === "announcement" ? "Comunicado" : "Notícia"} · {state}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </AdminSection>
  );
}
