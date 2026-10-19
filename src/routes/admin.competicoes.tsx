import { createFileRoute } from "@tanstack/react-router";

import { EntityAdmin } from "@/components/admin/EntityAdmin";
import { adminQueries } from "@/lib/admin-queries";
import { competitionKindLabel } from "@/lib/api";

export const Route = createFileRoute("/admin/competicoes")({ component: CompetitionsAdmin });

function CompetitionsAdmin() {
  return (
    <>
      <EntityAdmin
        title="Épocas"
        resource="seasons"
        noun="esta época (só é possível sem jogos)"
        query={adminQueries.seasons}
        defaults={{ isCurrent: false }}
        fields={[
          { key: "name", label: "Nome", type: "text", required: true, hint: "Ex.: 2027/2028" },
          { key: "startsOn", label: "Início", type: "date", required: true },
          { key: "endsOn", label: "Fim", type: "date", required: true },
          { key: "isCurrent", label: "Época atual (a que o site mostra)", type: "checkbox" },
        ]}
        summary={(s) => (
          <span>
            <span className="font-semibold">{s.name}</span>
            {s.isCurrent && <span className="eyebrow ml-2 text-primary">Atual</span>}
          </span>
        )}
      />
      <EntityAdmin
        title="Competições"
        resource="competitions"
        noun="esta competição (só é possível sem jogos)"
        query={adminQueries.competitions}
        defaults={{ kind: "league", position: 0, visible: true }}
        fields={[
          { key: "name", label: "Nome", type: "text", required: true },
          {
            key: "slug",
            label: "Endereço (slug)",
            type: "text",
            required: true,
            hint: "Ex.: super-liga → /super-liga",
          },
          {
            key: "kind",
            label: "Tipo",
            type: "select",
            options: Object.entries(competitionKindLabel).map(([value, label]) => ({
              value,
              label,
            })),
          },
          { key: "position", label: "Ordem no menu", type: "number" },
          { key: "tagline", label: "Subtítulo", type: "text" },
          { key: "sourceUrl", label: "Página oficial", type: "url" },
          { key: "description", label: "Descrição", type: "textarea" },
          { key: "visible", label: "Visível no site", type: "checkbox" },
          { key: "logoUrl", label: "Símbolo", type: "image" },
        ]}
        summary={(c) => (
          <span>
            <span className="font-semibold">{c.name}</span>
            <span className="ml-2 text-muted-foreground">{competitionKindLabel[c.kind]}</span>
            {!c.visible && <span className="ml-2 text-muted-foreground">(oculta)</span>}
          </span>
        )}
      />
    </>
  );
}
