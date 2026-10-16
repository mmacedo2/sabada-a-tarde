import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";

import {
  AdminSection,
  Empty,
  Field,
  ImageField,
  QueryState,
  confirmDelete,
  inputClass,
  useAdminMutation,
} from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Value = string | number | boolean | null;
type Row = { id: number } & Record<string, unknown>;

export type FieldDef =
  | { key: string; label: string; type: "text" | "date" | "url"; required?: boolean; hint?: string }
  | { key: string; label: string; type: "textarea" }
  | { key: string; label: string; type: "number" }
  | { key: string; label: string; type: "checkbox" }
  | { key: string; label: string; type: "image" }
  | {
      key: string;
      label: string;
      type: "select";
      options: { value: string | number; label: string }[];
      nullable?: boolean;
    };

/**
 * List + create/edit/delete for a reference table whose admin form is a flat set
 * of fields (clubs, competitions, seasons, players, documents).
 */
export function EntityAdmin<T extends Row>({
  title,
  resource,
  query,
  fields,
  defaults,
  summary,
  noun,
}: {
  title: string;
  resource: string;
  query: UseQueryOptions<T[], Error, T[], string[]>;
  fields: FieldDef[];
  defaults: Record<string, Value>;
  summary: (row: T) => ReactNode;
  noun: string;
}) {
  const rows = useQuery(query);
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const opts = { invalidate: [["admin", resource]], public: true };
  const create = useAdminMutation(
    (input: Record<string, Value>) => api.post(`/api/admin/${resource}`, input),
    {
      ...opts,
      success: "Criado.",
      onSuccess: () => setEditing(null),
    },
  );
  const update = useAdminMutation(
    ({ id, input }: { id: number; input: Record<string, Value> }) =>
      api.patch(`/api/admin/${resource}/${id}`, input),
    { ...opts, success: "Guardado.", onSuccess: () => setEditing(null) },
  );
  const remove = useAdminMutation((id: number) => api.delete(`/api/admin/${resource}/${id}`), {
    ...opts,
    success: "Apagado.",
  });

  return (
    <AdminSection
      title={title}
      actions={editing !== "new" && <Button onClick={() => setEditing("new")}>Novo</Button>}
    >
      {editing === "new" && (
        <div className="mb-6 rounded-lg border border-border p-4">
          <EntityForm
            fields={fields}
            initial={defaults}
            pending={create.isPending}
            onCancel={() => setEditing(null)}
            onSubmit={(input) => create.mutate(input)}
          />
        </div>
      )}
      <QueryState isLoading={rows.isLoading} error={rows.error} />
      {rows.data?.length === 0 && <Empty>Ainda não existem registos.</Empty>}
      <ul className="grid gap-2">
        {rows.data?.map((row) =>
          editing !== "new" && editing?.id === row.id ? (
            <li key={row.id} className="rounded-lg border border-primary/40 p-4">
              <EntityForm
                fields={fields}
                initial={Object.fromEntries(
                  fields.map((f) => [f.key, (row[f.key] as Value) ?? defaults[f.key] ?? null]),
                )}
                pending={update.isPending}
                onCancel={() => setEditing(null)}
                onSubmit={(input) => update.mutate({ id: row.id, input })}
              />
            </li>
          ) : (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm"
            >
              <div className="min-w-0">{summary(row)}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(row)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={remove.isPending}
                  onClick={() => confirmDelete(noun) && remove.mutate(row.id)}
                >
                  Apagar
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>
    </AdminSection>
  );
}

function EntityForm({
  fields,
  initial,
  pending,
  onSubmit,
  onCancel,
}: {
  fields: FieldDef[];
  initial: Record<string, Value>;
  pending: boolean;
  onSubmit: (input: Record<string, Value>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = (key: string, value: Value) => setForm((f) => ({ ...f, [key]: value }));
  const str = (key: string) => (form[key] == null ? "" : String(form[key]));

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        if (f.type === "checkbox") {
          return (
            <label key={f.key} className="flex items-center gap-2 self-end text-sm">
              <input
                type="checkbox"
                checked={Boolean(form[f.key])}
                onChange={(e) => set(f.key, e.target.checked)}
              />
              {f.label}
            </label>
          );
        }
        if (f.type === "image") {
          return (
            <div key={f.key} className="sm:col-span-2">
              <ImageField
                label={f.label}
                value={(form[f.key] as string | null) ?? null}
                onChange={(v) => set(f.key, v)}
              />
            </div>
          );
        }
        return (
          <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
            <Field label={f.label} {...("hint" in f && f.hint ? { hint: f.hint } : {})}>
              {(id) =>
                f.type === "textarea" ? (
                  <textarea
                    id={id}
                    rows={3}
                    className={`${inputClass} py-2`}
                    value={str(f.key)}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                ) : f.type === "select" ? (
                  <select
                    id={id}
                    className={inputClass}
                    value={str(f.key)}
                    onChange={(e) => {
                      const option = f.options.find((o) => String(o.value) === e.target.value);
                      set(f.key, option ? option.value : null);
                    }}
                  >
                    {f.nullable && <option value="">—</option>}
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "number" ? (
                  <input
                    id={id}
                    type="number"
                    className={inputClass}
                    value={str(f.key)}
                    onChange={(e) =>
                      set(f.key, e.target.value === "" ? null : Number(e.target.value))
                    }
                  />
                ) : (
                  <input
                    id={id}
                    type={f.type}
                    required={"required" in f && f.required}
                    className={inputClass}
                    value={str(f.key)}
                    onChange={(e) => set(f.key, e.target.value === "" ? null : e.target.value)}
                  />
                )
              }
            </Field>
          </div>
        );
      })}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "A guardar…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
