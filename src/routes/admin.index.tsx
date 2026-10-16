import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { AdminSection, Empty, QueryState } from "@/components/admin/form";
import { formatShortDate } from "@/data/afpg";
import { adminQueries } from "@/lib/admin-queries";
import { byDateAsc, isLive, statusLabel, type Game } from "@/lib/api";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

const DAY_MS = 24 * 60 * 60 * 1000;

function Dashboard() {
  const games = useQuery({ ...adminQueries.games("current"), refetchInterval: 30_000 });
  const clubs = useQuery(adminQueries.clubs);
  const articles = useQuery(adminQueries.articles);

  const today = new Date().toISOString().slice(0, 10);
  const weekAhead = new Date(Date.now() + 7 * DAY_MS).toISOString().slice(0, 10);
  const all = [...(games.data ?? [])].sort(byDateAsc);
  const live = all.filter(isLive);
  // Past games still "scheduled" are results someone forgot to enter.
  const missing = all.filter((g) => g.status === "scheduled" && g.date < today);
  const upcoming = all.filter(
    (g) => g.status === "scheduled" && g.date >= today && g.date <= weekAhead,
  );
  const drafts = articles.data?.filter((a) => a.status === "draft").length ?? 0;

  const name = (id: number | null, placeholder: string | null) =>
    clubs.data?.find((c) => c.id === id)?.shortName ?? placeholder ?? "—";

  const list = (items: Game[], empty: string) =>
    items.length === 0 ? (
      <Empty>{empty}</Empty>
    ) : (
      <ul className="grid gap-2">
        {items.map((g) => (
          <li key={g.id}>
            <Link
              to="/admin/jogos/$id"
              params={{ id: String(g.id) }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm hover:bg-muted"
            >
              <span className="font-semibold">
                {name(g.homeClubId, g.homePlaceholder)}{" "}
                <span className="stat text-primary">
                  {g.homeGoals != null ? `${g.homeGoals}–${g.awayGoals}` : "vs"}
                </span>{" "}
                {name(g.awayClubId, g.awayPlaceholder)}
              </span>
              <span className="text-muted-foreground">
                {formatShortDate(g.date)} {g.kickoffTime} · {statusLabel[g.status]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <QueryState isLoading={games.isLoading} error={games.error} />
      <AdminSection title="Ao vivo">{list(live, "Nenhum jogo a decorrer.")}</AdminSection>
      {missing.length > 0 && (
        <AdminSection title="Resultados em falta">{list(missing, "")}</AdminSection>
      )}
      <AdminSection title="Próximos 7 dias">
        {list(upcoming, "Sem jogos agendados para os próximos dias.")}
      </AdminSection>
      {drafts > 0 && (
        <AdminSection title="Rascunhos">
          <Link to="/admin/noticias" className="text-primary hover:underline">
            {drafts} {drafts === 1 ? "notícia por publicar" : "notícias por publicar"} →
          </Link>
        </AdminSection>
      )}
    </>
  );
}
