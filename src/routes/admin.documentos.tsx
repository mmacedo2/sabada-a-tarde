import { createFileRoute } from "@tanstack/react-router";

import { EntityAdmin } from "@/components/admin/EntityAdmin";
import { adminQueries } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin/documentos")({ component: DocumentsAdmin });

function DocumentsAdmin() {
  return (
    <EntityAdmin
      title="Documentos"
      resource="documents"
      noun="este documento"
      query={adminQueries.documents}
      defaults={{ visible: true }}
      fields={[
        { key: "title", label: "Título", type: "text", required: true },
        {
          key: "category",
          label: "Categoria",
          type: "text",
          required: true,
          hint: "Use o nome de uma competição (ex.: Super Liga) para o mostrar na página dela.",
        },
        { key: "url", label: "Endereço do documento", type: "url", required: true },
        { key: "publishedOn", label: "Data", type: "date" },
        { key: "visible", label: "Visível no site", type: "checkbox" },
      ]}
      summary={(d) => (
        <span>
          <span className="font-semibold">{d.title}</span>
          <span className="ml-2 text-muted-foreground">{d.category}</span>
        </span>
      )}
    />
  );
}
