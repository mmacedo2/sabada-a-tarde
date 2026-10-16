import { useState, type FormEvent } from "react";

import { Field, inputClass } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { statusLabel, type Club, type Competition, type Game, type GameStatus } from "@/lib/api";

export type GameInput = {
  competitionId: number;
  round: string;
  stage: string | null;
  homeClubId: number | null;
  awayClubId: number | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  date: string;
  kickoffTime: string | null;
  venue: string | null;
  status: GameStatus;
  homeGoals: number | null;
  awayGoals: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  notes: string | null;
  visible: boolean;
};

const blank = (competitionId: number): GameInput => ({
  competitionId,
  round: "",
  stage: null,
  homeClubId: null,
  awayClubId: null,
  homePlaceholder: null,
  awayPlaceholder: null,
  date: new Date().toISOString().slice(0, 10),
  kickoffTime: "15:00",
  venue: null,
  status: "scheduled",
  homeGoals: null,
  awayGoals: null,
  homePenalties: null,
  awayPenalties: null,
  notes: null,
  visible: true,
});

const fromGame = (g: Game): GameInput => ({
  competitionId: g.competitionId,
  round: g.round,
  stage: g.stage,
  homeClubId: g.homeClubId,
  awayClubId: g.awayClubId,
  homePlaceholder: g.homePlaceholder,
  awayPlaceholder: g.awayPlaceholder,
  date: g.date,
  kickoffTime: g.kickoffTime,
  venue: g.venue,
  status: g.status,
  homeGoals: g.homeGoals,
  awayGoals: g.awayGoals,
  homePenalties: g.homePenalties,
  awayPenalties: g.awayPenalties,
  notes: g.notes,
  visible: g.visible,
});

const text = (v: string) => (v.trim() === "" ? null : v);
const num = (v: string) => (v === "" ? null : Number(v));

export function GameForm({
  game,
  clubs,
  competitions,
  pending,
  submitLabel,
  onSubmit,
}: {
  game?: Game;
  clubs: Club[];
  competitions: Competition[];
  pending: boolean;
  submitLabel: string;
  onSubmit: (input: GameInput) => void;
}) {
  const [form, setForm] = useState<GameInput>(() =>
    game ? fromGame(game) : blank(competitions[0]?.id ?? 0),
  );
  const set = <K extends keyof GameInput>(key: K, value: GameInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  const side = (which: "home" | "away") => {
    const clubKey = which === "home" ? "homeClubId" : "awayClubId";
    const placeholderKey = which === "home" ? "homePlaceholder" : "awayPlaceholder";
    return (
      <div className="grid gap-2">
        <Field label={which === "home" ? "Equipa da casa" : "Equipa visitante"}>
          {(id) => (
            <select
              id={id}
              className={inputClass}
              value={form[clubKey] ?? ""}
              onChange={(e) => set(clubKey, num(e.target.value))}
            >
              <option value="">— Por definir —</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        {form[clubKey] == null && (
          <input
            aria-label={`Texto a mostrar (${which === "home" ? "casa" : "fora"})`}
            className={inputClass}
            placeholder="Ex.: Vencedor jogo 4"
            value={form[placeholderKey] ?? ""}
            onChange={(e) => set(placeholderKey, text(e.target.value))}
          />
        )}
      </div>
    );
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Competição">
          {(id) => (
            <select
              id={id}
              className={inputClass}
              value={form.competitionId}
              onChange={(e) => set("competitionId", Number(e.target.value))}
            >
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Jornada / fase">
          {(id) => (
            <input
              id={id}
              required
              className={inputClass}
              placeholder="1ª Jornada"
              value={form.round}
              onChange={(e) => set("round", e.target.value)}
            />
          )}
        </Field>
        <Field label="Jogo (opcional)">
          {(id) => (
            <input
              id={id}
              className={inputClass}
              placeholder="Jogo 1"
              value={form.stage ?? ""}
              onChange={(e) => set("stage", text(e.target.value))}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {side("home")}
        {side("away")}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Data">
          {(id) => (
            <input
              id={id}
              type="date"
              required
              className={inputClass}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          )}
        </Field>
        <Field label="Hora">
          {(id) => (
            <input
              id={id}
              type="time"
              className={inputClass}
              value={form.kickoffTime ?? ""}
              onChange={(e) => set("kickoffTime", text(e.target.value))}
            />
          )}
        </Field>
        <Field label="Campo">
          {(id) => (
            <input
              id={id}
              className={inputClass}
              value={form.venue ?? ""}
              onChange={(e) => set("venue", text(e.target.value))}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        <Field label="Estado">
          {(id) => (
            <select
              id={id}
              className={inputClass}
              value={form.status}
              onChange={(e) => set("status", e.target.value as GameStatus)}
            >
              {Object.entries(statusLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </Field>
        {(
          [
            ["homeGoals", "Golos casa"],
            ["awayGoals", "Golos fora"],
            ["homePenalties", "Pen. casa"],
            ["awayPenalties", "Pen. fora"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            {(id) => (
              <input
                id={id}
                type="number"
                min={0}
                max={99}
                className={inputClass}
                value={form[key] ?? ""}
                onChange={(e) => set(key, num(e.target.value))}
              />
            )}
          </Field>
        ))}
      </div>

      <Field label="Notas">
        {(id) => (
          <input
            id={id}
            className={inputClass}
            value={form.notes ?? ""}
            onChange={(e) => set("notes", text(e.target.value))}
          />
        )}
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(e) => set("visible", e.target.checked)}
          />
          Visível no site
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "A guardar…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
