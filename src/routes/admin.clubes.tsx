import { createFileRoute } from "@tanstack/react-router";

import { EntityAdmin } from "@/components/admin/EntityAdmin";
import { Crest } from "@/components/site/Crest";
import { adminQueries } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin/clubes")({ component: ClubsAdmin });

function ClubsAdmin() {
  return (
    <EntityAdmin
      title="Clubes"
      resource="clubs"
      noun="este clube"
      query={adminQueries.clubs}
      defaults={{ visible: true }}
      fields={[
        { key: "name", label: "Nome", type: "text", required: true },
        { key: "shortName", label: "Nome curto", type: "text", required: true },
        {
          key: "slug",
          label: "Endereço (slug)",
          type: "text",
          required: true,
          hint: "Ex.: sao-faustino → /clubes/sao-faustino",
        },
        { key: "initials", label: "Iniciais", type: "text" },
        { key: "locality", label: "Freguesia", type: "text" },
        { key: "foundedOn", label: "Fundação", type: "date" },
        {
          key: "color",
          label: "Cor (CSS)",
          type: "text",
          hint: "Ex.: #b91c1c ou oklch(0.55 0.22 27)",
        },
        { key: "colorLabel", label: "Cores (texto)", type: "text" },
        { key: "website", label: "Site", type: "url" },
        { key: "visible", label: "Visível no site", type: "checkbox" },
        { key: "crestUrl", label: "Símbolo", type: "image" },
      ]}
      summary={(c) => (
        <span className="flex items-center gap-3">
          <Crest club={c} size="sm" />
          <span>
            <span className="font-semibold">{c.name}</span>
            {!c.visible && <span className="ml-2 text-muted-foreground">(oculto)</span>}
          </span>
        </span>
      )}
    />
  );
}
