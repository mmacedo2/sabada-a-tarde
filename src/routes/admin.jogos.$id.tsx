import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { GameForm, type GameInput } from "@/components/admin/GameForm";
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
import { api, statusLabel, type GameDetail, type GameEventType, type GameStatus } from "@/lib/api";

export const Route = createFileRoute("/admin/jogos/$id")({ component: GameAdmin });

const eventLabel: Record<GameEventType, string> = {
  goal: "Golo",
  penalty_goal: "Golo (penálti)",
  own_goal: "Autogolo",
  yellow_card: "Cartão amarelo",
  red_card: "Cartão vermelho",
};

/** The buttons a match-day admin needs, in the order a game happens. */
const transitions: { label: string; to: GameStatus; from: GameStatus[] }[] = [
  { label: "Iniciar jogo", to: "live", from: ["scheduled", "postponed"] },
  { label: "Intervalo", to: "halftime", from: ["live"] },
  { label: "2ª parte", to: "live", from: ["halftime"] },
  { label: "Terminar jogo", to: "finished", from: ["live", "halftime"] },
  { label: "Reabrir", to: "live", from: ["finished"] },
  { label: "Adiar", to: "postponed", from: ["scheduled"] },
  { label: "Cancelar", to: "cancelled", from: ["scheduled", "postponed"] },
];

function GameAdmin() {
  const id = Number(Route.useParams().id);
  const navigate = useNavigate();
  const game = useQuery(adminQueries.game(id));
  const clubs = useQuery(adminQueries.clubs);
  const competitions = useQuery(adminQueries.competitions);

  const invalidate = [
    ["admin", "game", id],
    ["admin", "games"],
  ];
  const patch = useAdminMutation(
    (input: Partial<GameInput>) => api.patch<GameDetail>(`/api/admin/games/${id}`, input),
    {
      invalidate,
      public: true,
    },
  );
  const save = useAdminMutation(
    (input: GameInput) => api.patch<GameDetail>(`/api/admin/games/${id}`, input),
    {
      invalidate,
      public: true,
      success: "Jogo guardado.",
    },
  );
  const remove = useAdminMutation(() => api.delete(`/api/admin/games/${id}`), {
    invalidate: [["admin", "games"]],
    public: true,
    success: "Jogo apagado.",
    onSuccess: () => void navigate({ to: "/admin/jogos" }),
  });
  const removeEvent = useAdminMutation(
    (eventId: number) => api.delete(`/api/admin/games/${id}/events/${eventId}`),
    {
      invalidate,
      public: true,
    },
  );

  if (!game.data) return <QueryState isLoading={game.isLoading} error={game.error} />;
  const g = game.data;
  const home = clubs.data?.find((c) => c.id === g.homeClubId);
  const away = clubs.data?.find((c) => c.id === g.awayClubId);
  const started = g.status === "live" || g.status === "halftime" || g.status === "finished";
  const decided = home != null && away != null;

  const adjust = (side: "homeGoals" | "awayGoals", delta: number) =>
    patch.mutate({ [side]: Math.max(0, (g[side] ?? 0) + delta) });

  return (
    <>
      <Link to="/admin/jogos" className="eyebrow text-primary hover:underline">
        ← Jogos
      </Link>

      <AdminSection title="Marcador">
        <p className="eyebrow text-muted-foreground">
          {g.round}
          {g.stage && ` · ${g.stage}`} · {formatDate(g.date)} {g.kickoffTime}
        </p>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
          <ScoreSide
            name={home?.shortName ?? g.homePlaceholder ?? "—"}
            goals={g.homeGoals}
            enabled={started && !patch.isPending}
            onAdjust={(d) => adjust("homeGoals", d)}
          />
          <p className="eyebrow rounded-md bg-muted px-3 py-1.5">{statusLabel[g.status]}</p>
          <ScoreSide
            name={away?.shortName ?? g.awayPlaceholder ?? "—"}
            goals={g.awayGoals}
            enabled={started && !patch.isPending}
            onAdjust={(d) => adjust("awayGoals", d)}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {transitions
            .filter((t) => t.from.includes(g.status))
            .map((t) => (
              <Button
                key={t.label}
                variant={t.to === "live" || t.to === "finished" ? "default" : "outline"}
                disabled={patch.isPending || (t.to === "live" && !decided)}
                onClick={() => patch.mutate({ status: t.to })}
              >
                {t.label}
              </Button>
            ))}
        </div>
        {!decided && (
          <p className="mt-3 text-sm text-muted-foreground">
            Defina as duas equipas antes de iniciar o jogo.
          </p>
        )}
      </AdminSection>

      {started && home && away && (
        <AdminSection title="Eventos">
          <EventForm gameId={id} clubs={[home, away]} />
          {g.events.length === 0 ? (
            <div className="mt-5">
              <Empty>Sem eventos registados. Os golos registados aqui atualizam o resultado.</Empty>
            </div>
          ) : (
            <ul className="mt-5 grid gap-2">
              {g.events.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-4 py-2.5 text-sm"
                >
                  <span>
                    <span className="stat mr-2">{e.minute != null ? `${e.minute}'` : "—"}</span>
                    {eventLabel[e.type]} · {e.clubId === home.id ? home.shortName : away.shortName}
                    {e.playerName && ` · ${e.playerName}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={removeEvent.isPending}
                    onClick={() => removeEvent.mutate(e.id)}
                  >
                    Anular
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </AdminSection>
      )}

      <AdminSection
        title="Detalhes"
        actions={
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => confirmDelete("este jogo") && remove.mutate(undefined)}
          >
            Apagar jogo
          </Button>
        }
      >
        {clubs.data && competitions.data && (
          // Keyed on updatedAt so the form picks up changes made with the live controls.
          <GameForm
            key={g.updatedAt}
            game={g}
            clubs={clubs.data}
            competitions={competitions.data}
            pending={save.isPending}
            submitLabel="Guardar"
            onSubmit={(input) => save.mutate(input)}
          />
        )}
      </AdminSection>
    </>
  );
}

function ScoreSide({
  name,
  goals,
  enabled,
  onAdjust,
}: {
  name: string;
  goals: number | null;
  enabled: boolean;
  onAdjust: (delta: number) => void;
}) {
  return (
    <div>
      <p className="font-semibold">{name}</p>
      <p className="stat mt-2 text-5xl leading-none">{goals ?? "–"}</p>
      <div className="mt-3 flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-label={`Retirar golo a ${name}`}
          disabled={!enabled || !goals}
          onClick={() => onAdjust(-1)}
        >
          −1
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Somar golo a ${name}`}
          disabled={!enabled}
          onClick={() => onAdjust(1)}
        >
          +1
        </Button>
      </div>
    </div>
  );
}

function EventForm({
  gameId,
  clubs,
}: {
  gameId: number;
  clubs: { id: number; shortName: string }[];
}) {
  const [type, setType] = useState<GameEventType>("goal");
  const [clubId, setClubId] = useState(clubs[0]!.id);
  const [playerName, setPlayerName] = useState("");
  const [minute, setMinute] = useState("");
  const add = useAdminMutation(
    () =>
      api.post(`/api/admin/games/${gameId}/events`, {
        type,
        clubId,
        playerName: playerName || null,
        minute: minute === "" ? null : Number(minute),
      }),
    {
      invalidate: [
        ["admin", "game", gameId],
        ["admin", "games"],
      ],
      public: true,
      onSuccess: () => {
        setPlayerName("");
        setMinute("");
      },
    },
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    add.mutate(undefined);
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 sm:grid-cols-[1fr_1fr_1.5fr_6rem_auto] sm:items-end"
    >
      <Field label="Evento">
        {(id) => (
          <select
            id={id}
            className={inputClass}
            value={type}
            onChange={(e) => setType(e.target.value as GameEventType)}
          >
            {Object.entries(eventLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Equipa do jogador">
        {(id) => (
          <select
            id={id}
            className={inputClass}
            value={clubId}
            onChange={(e) => setClubId(Number(e.target.value))}
          >
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Jogador (opcional)">
        {(id) => (
          <input
            id={id}
            className={inputClass}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        )}
      </Field>
      <Field label="Minuto">
        {(id) => (
          <input
            id={id}
            type="number"
            min={0}
            max={150}
            className={inputClass}
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
          />
        )}
      </Field>
      <Button type="submit" disabled={add.isPending}>
        Registar
      </Button>
    </form>
  );
}
