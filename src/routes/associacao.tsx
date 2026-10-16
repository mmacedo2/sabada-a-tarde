import { Link, createFileRoute } from "@tanstack/react-router";

import { DocumentList } from "@/components/site/DocumentList";
import { PageHeader, SectionTitle } from "@/components/site/PageHeader";
import { ASSOCIATION } from "@/data/afpg";
import { api, type Doc } from "@/lib/api";
import { useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/associacao")({
  loader: () => api.get<Doc[]>("/api/documents"),
  head: () => ({
    meta: [
      { title: "A Associação — Sábado à Tarde" },
      {
        name: "description",
        content:
          "Sobre a Associação de Futebol Popular de Guimarães: missão, secretaria, regulamentos, impressos e documentos oficiais.",
      },
      { property: "og:title", content: "A Associação — Sábado à Tarde" },
      { property: "og:description", content: "Missão, secretaria e documentação da AFPG." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/associacao" },
    ],
    links: [{ rel: "canonical", href: "/associacao" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const documents = Route.useLoaderData();
  const { season, clubs } = useCatalog();
  const institutional = documents.filter((d) =>
    [
      "Regulamentos",
      "Impressos AFPG",
      "Impressos FFPN",
      "Secretaria",
      "Interconcelhias FFPN",
      "Conselho de Disciplina",
    ].includes(d.category),
  );

  return (
    <>
      <PageHeader
        eyebrow="Institucional"
        title="A Associação"
        description="A AFPG organiza e regula o futebol popular do concelho de Guimarães, reunindo clubes das freguesias em competições próprias."
      />

      <section className="container-afpg grid gap-12 py-14 md:py-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionTitle eyebrow="Sobre nós" title="Futebol das freguesias" />
          <div className="max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              A Associação de Futebol Popular de Guimarães reúne os clubes populares do concelho e
              organiza as suas competições oficiais: a Super Liga 1ª Divisão, a Taça Associação, a
              Taça Cidade Berço e a Taça de Disciplina.
            </p>
            <p>
              Na época {season?.name ?? "atual"} participam {clubs.length} clubes das freguesias de
              Guimarães. Toda a atividade competitiva é publicada em documentos oficiais —
              calendários, classificações, boletins de resultados e comunicados — acessíveis a
              partir deste site.
            </p>
            <p>
              A secretaria da Associação assegura o apoio aos clubes, a receção de impressos e a
              articulação com a FFPN, incluindo as competições interconcelhias.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/documentos"
              className="eyebrow inline-flex min-h-12 items-center rounded-md bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary-deep"
            >
              Documentos oficiais
            </Link>
            <Link
              to="/contactos"
              className="eyebrow inline-flex min-h-12 items-center rounded-md border border-border px-6 transition-colors hover:bg-muted"
            >
              Contactos
            </Link>
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-card p-6 shadow-card">
          <p className="eyebrow text-primary">Sede e secretaria</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="font-semibold text-foreground">{ASSOCIATION.name}</li>
            <li>{ASSOCIATION.address}</li>
            <li>
              tel. {ASSOCIATION.phone} · fax {ASSOCIATION.fax}
            </li>
            <li>
              <a href={`mailto:${ASSOCIATION.email}`} className="text-primary hover:underline">
                {ASSOCIATION.email}
              </a>
            </li>
          </ul>
        </aside>
      </section>

      <section className="container-afpg pb-8">
        <SectionTitle eyebrow="Regulamentos e impressos" title="Documentação institucional" />
        <DocumentList docs={institutional} />
      </section>
    </>
  );
}
