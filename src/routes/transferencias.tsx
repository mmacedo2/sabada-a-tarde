import { Link, createFileRoute } from "@tanstack/react-router";

import { Crest } from "@/components/site/Crest";
import { PageHeader } from "@/components/site/PageHeader";
import { formatDate } from "@/data/afpg";
import { api, type Club, type Transfer } from "@/lib/api";
import { useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/transferencias")({
  loader: () => api.get<Transfer[]>("/api/transfers?limit=100"),
  head: () => ({
    meta: [
      { title: "Transferências — Sábado à Tarde" },
      {
        name: "description",
        content: "Entradas e saídas de jogadores nos clubes do futebol popular de Guimarães.",
      },
      { property: "og:title", content: "Transferências — Sábado à Tarde" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/transferencias" },
    ],
    links: [{ rel: "canonical", href: "/transferencias" }],
  }),
  component: TransfersPage,
});

function TransfersPage() {
  const transfers = Route.useLoaderData();
  const { clubBySlug } = useCatalog();

  return (
    <>
      <PageHeader
        eyebrow="Mercado"
        title="Transferências"
        description="Quem chega, quem sai e quem muda de freguesia."
      />
      <section className="container-afpg py-14 md:py-16">
        {transfers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-sm text-muted-foreground">
            Ainda não há transferências registadas.
          </p>
        ) : (
          <ul className="grid gap-3">
            {transfers.map((t) => (
              <li
                key={t.id}
                className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {t.playerNickname ? `${t.playerNickname} (${t.playerName})` : t.playerName}
                  </p>
                  <p className="eyebrow text-muted-foreground">{formatDate(t.date)}</p>
                  {t.notes && <p className="mt-1 text-sm text-muted-foreground">{t.notes}</p>}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ClubTag club={clubBySlug(t.fromClub)} empty="Sem clube" />
                  <span aria-label="para" className="text-primary">
                    →
                  </span>
                  <ClubTag club={clubBySlug(t.toClub)} empty="Sem clube" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ClubTag({ club, empty }: { club: Club | undefined; empty: string }) {
  if (!club) return <span className="text-muted-foreground">{empty}</span>;
  return (
    <Link
      to="/clubes/$slug"
      params={{ slug: club.slug }}
      className="flex items-center gap-2 font-semibold hover:text-primary"
    >
      <Crest club={club} size="xs" />
      {club.shortName}
    </Link>
  );
}
