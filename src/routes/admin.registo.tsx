import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminSection, Empty, QueryState } from "@/components/admin/form";
import { formatDateTime } from "@/data/afpg";
import { adminQueries } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin/registo")({ component: AuditPage });

const actionLabel = { create: "criou", update: "alterou", delete: "apagou" } as const;

function AuditPage() {
  const audit = useQuery(adminQueries.audit);
  return (
    <AdminSection title="Registo de alterações">
      <QueryState isLoading={audit.isLoading} error={audit.error} />
      {audit.data?.length === 0 && <Empty>Sem alterações registadas.</Empty>}
      <ul className="grid gap-1.5 text-sm">
        {audit.data?.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap justify-between gap-2 border-b border-border py-2"
          >
            <span>
              <span className="font-semibold">{a.userName ?? "Utilizador removido"}</span>{" "}
              {actionLabel[a.action]} {a.entity}
              {a.entityId != null && ` #${a.entityId}`}
            </span>
            <span className="text-muted-foreground">{formatDateTime(a.createdAt)}</span>
          </li>
        ))}
      </ul>
    </AdminSection>
  );
}
