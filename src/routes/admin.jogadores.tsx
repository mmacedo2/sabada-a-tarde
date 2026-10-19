import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { EntityAdmin } from "@/components/admin/EntityAdmin";
import { adminQueries } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin/jogadores")({ component: PlayersAdmin });

const positionOptions = [
  { value: "goalkeeper", label: "Guarda-redes" },
  { value: "defender", label: "Defesa" },
  { value: "midfielder", label: "Médio" },
  { value: "forward", label: "Avançado" },
];

function PlayersAdmin() {
  const clubs = useQuery(adminQueries.clubs);
  const clubName = (id: unknown) => clubs.data?.find((c) => c.id === id)?.shortName ?? "Sem clube";
  return (
    <EntityAdmin
      title="Jogadores"
      resource="players"
      noun="este jogador"
      query={adminQueries.players}
      defaults={{ visible: true }}
      fields={[
        { key: "name", label: "Nome", type: "text", required: true },
        { key: "nickname", label: "Alcunha", type: "text" },
        {
          key: "position",
          label: "Posição",
          type: "select",
          nullable: true,
          options: positionOptions,
        },
        {
          key: "clubId",
          label: "Clube",
          type: "select",
          nullable: true,
          options: (clubs.data ?? []).map((c) => ({ value: c.id, label: c.name })),
        },
        { key: "birthDate", label: "Data de nascimento", type: "date" },
        { key: "visible", label: "Visível no site", type: "checkbox" },
        { key: "photoUrl", label: "Fotografia", type: "image" },
      ]}
      summary={(p) => (
        <span>
          <span className="font-semibold">{p.nickname ? `${p.nickname} (${p.name})` : p.name}</span>
          <span className="ml-2 text-muted-foreground">{clubName(p.clubId)}</span>
        </span>
      )}
    />
  );
}
