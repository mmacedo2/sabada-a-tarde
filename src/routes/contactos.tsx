import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/site/PageHeader";
import { ASSOCIATION } from "@/data/afpg";

export const Route = createFileRoute("/contactos")({
  head: () => ({
    meta: [
      { title: "Contactos — Sábado à Tarde" },
      {
        name: "description",
        content:
          "Contactos da Associação de Futebol Popular de Guimarães: sede em Polvoreira, telefone, email e secretaria.",
      },
      { property: "og:title", content: "Contactos — Sábado à Tarde" },
      { property: "og:description", content: "Sede, telefone e email da AFPG." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contactos" },
    ],
    links: [{ rel: "canonical", href: "/contactos" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SportsOrganization",
          name: ASSOCIATION.name,
          alternateName: ASSOCIATION.short,
          email: ASSOCIATION.email,
          telephone: ASSOCIATION.phone,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Rua de Covas, 260 — Polvoreira",
            postalCode: "4835-157",
            addressLocality: "Guimarães",
            addressCountry: "PT",
          },
        }),
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Fala com a Associação"
        title="Contactos"
        description="A secretaria da AFPG apoia clubes, dirigentes e atletas do futebol popular de Guimarães."
      />

      <section className="container-afpg grid gap-4 py-14 md:grid-cols-3 md:py-16">
        {[
          { label: "Sede", value: ASSOCIATION.address },
          {
            label: "Telefone",
            value: `tel. ${ASSOCIATION.phone}`,
            href: `tel:${ASSOCIATION.phone.replace(/\s/g, "")}`,
          },
          { label: "Email", value: ASSOCIATION.email, href: `mailto:${ASSOCIATION.email}` },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <p className="eyebrow text-primary">{c.label}</p>
            {c.href ? (
              <a
                href={c.href}
                className="mt-3 block font-display text-lg font-bold hover:text-primary"
              >
                {c.value}
              </a>
            ) : (
              <p className="mt-3 font-display text-lg font-bold leading-snug">{c.value}</p>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
