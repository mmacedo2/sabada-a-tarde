import { Link, createFileRoute } from "@tanstack/react-router";

import { Crest } from "@/components/site/Crest";
import { PageHeader } from "@/components/site/PageHeader";
import { loadMainLeague } from "@/lib/api";
import { useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/clubes/")({
  loader: ({ context }) => loadMainLeague(context.queryClient),
  head: () => ({
    meta: [
      { title: "Equipas — Sábado à Tarde" },
      {
        name: "description",
        content:
          "Todos os clubes filiados na Associação de Futebol Popular de Guimarães: símbolos, freguesias e competições.",
      },
      { property: "og:title", content: "Equipas — Sábado à Tarde" },
      { property: "og:description", content: "Clubes filiados na AFPG, freguesia a freguesia." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/clubes" },
    ],
    links: [{ rel: "canonical", href: "/clubes" }],
  }),
  component: ClubsPage,
});

function ClubsPage() {
  const { league, standings } = Route.useLoaderData();
  const { season, clubs } = useCatalog();
  return (
    <>
      <PageHeader
        eyebrow={season ? `Época ${season.name}` : undefined}
        title="Equipas"
        description="Os clubes que fazem o futebol popular de Guimarães. Cada símbolo foi modernizado preservando cores, iniciais e referência à freguesia."
      />
      <section className="container-afpg py-16 md:py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => {
            const stats = standings.find((r) => r.club === club.slug);
            return (
              <Link
                key={club.slug}
                to="/clubes/$slug"
                params={{ slug: club.slug }}
                className="group flex items-center gap-5 rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
                style={{ ["--club" as string]: club.color ?? "var(--primary)" }}
              >
                <Crest
                  club={club}
                  size="lg"
                  className="transition-transform group-hover:scale-105"
                />
                <div className="min-w-0">
                  <h2 className="font-display text-base font-extrabold leading-tight">
                    {club.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{club.locality}</p>
                  <p className="eyebrow mt-3 text-[var(--club)]">
                    {stats && league ? `${league.name} · ${stats.position}º lugar` : club.locality}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
