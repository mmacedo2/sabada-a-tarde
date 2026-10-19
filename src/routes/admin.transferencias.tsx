import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import {
  AdminSection,
  Empty,
  Field,
  QueryState,
  confirmDelete,
  inputClass,
  useAdminMutation,
} from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/data/afpg";
import { adminQueries } from "@/lib/admin-queries";
import { api, type Player } from "@/lib/api";

export const Route = createFileRoute("/admin/transferencias")({ component: TransfersAdmin });

function TransfersAdmin() {
  const transfers = useQuery(adminQueries.transfers);
  const players = useQuery(adminQueries.players);
  const clubs = useQuery(adminQueries.clubs);
  const [playerId, setPlayerId] = useState<number | "new" | "">("");
  const [newPlayer, setNewPlayer] = useState("");
  const [toClubId, setToClubId] = useState<number | "">("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const invalidate = [
    ["admin", "transfers"],
    ["admin", "players"],
  ];
  const create = useAdminMutation(
    async () => {
      // A new player is created without a club; the transfer then places them.
      const id =
        playerId === "new"
          ? (await api.post<Player>("/api/admin/players", { name: newPlayer })).id
          : Number(playerId);
      const fromClubId = players.data?.find((p) => p.id === id)?.clubId ?? null;
      return api.post("/api/admin/transfers", {
        playerId: id,
        fromClubId,
        toClubId: toClubId || null,
        date,
        notes: notes || null,
      });
    },
    {
      invalidate,
      public: true,
      success: "Transferência registada.",
      onSuccess: () => {
        setPlayerId("");
        setNewPlayer("");
        setToClubId("");
        setNotes("");
      },
    },
  );
  const remove = useAdminMutation((id: number) => api.delete(`/api/admin/transfers/${id}`), {
    invalidate,
    public: true,
    success: "Transferência apagada.",
  });

  const clubName = (id: number | null) =>
    id == null ? "Sem clube" : (clubs.data?.find((c) => c.id === id)?.shortName ?? "—");
  const selected =
    typeof playerId === "number" ? players.data?.find((p) => p.id === playerId) : undefined;

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate(undefined);
  }

  return (
    <AdminSection title="Transferências">
      <form
        onSubmit={submit}
        className="mb-8 grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2"
      >
        <Field label="Jogador">
          {(id) => (
            <select
              id={id}
              required
              className={inputClass}
              value={playerId}
              onChange={(e) =>
                setPlayerId(
                  e.target.value === "new"
                    ? "new"
                    : e.target.value === ""
                      ? ""
                      : Number(e.target.value),
                )
              }
            >
              <option value="">— Escolher —</option>
              <option value="new">+ Novo jogador</option>
              {players.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({clubName(p.clubId)})
                </option>
              ))}
            </select>
          )}
        </Field>
        {playerId === "new" ? (
          <Field label="Nome do novo jogador">
            {(id) => (
              <input
                id={id}
                required
                className={inputClass}
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
              />
            )}
          </Field>
        ) : (
          <Field label="Sai de">
            {(id) => (
              <input
                id={id}
                disabled
                className={inputClass}
                value={selected ? clubName(selected.clubId) : ""}
              />
            )}
          </Field>
        )}
        <Field label="Entra em">
          {(id) => (
            <select
              id={id}
              className={inputClass}
              value={toClubId}
              onChange={(e) => setToClubId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Sem clube (fim de contrato)</option>
              {clubs.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Data">
          {(id) => (
            <input
              id={id}
              type="date"
              required
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notas">
            {(id) => (
              <input
                id={id}
                className={inputClass}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            )}
          </Field>
        </div>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={create.isPending}>
            Registar transferência
          </Button>
        </div>
      </form>

      <QueryState isLoading={transfers.isLoading} error={transfers.error} />
      {transfers.data?.length === 0 && <Empty>Ainda não há transferências.</Empty>}
      <ul className="grid gap-2">
        {transfers.data?.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm"
          >
            <span>
              <span className="font-semibold">{t.playerName}</span> · {clubName(t.fromClubId)} →{" "}
              {clubName(t.toClubId)} ·{" "}
              <span className="text-muted-foreground">{formatDate(t.date)}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => confirmDelete("esta transferência") && remove.mutate(t.id)}
            >
              Apagar
            </Button>
          </li>
        ))}
      </ul>
    </AdminSection>
  );
}
