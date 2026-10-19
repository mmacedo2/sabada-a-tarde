import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import {
  AdminSection,
  Field,
  QueryState,
  inputClass,
  useAdminMutation,
} from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/data/afpg";
import { adminQueries } from "@/lib/admin-queries";
import { api, type Role, type User } from "@/lib/api";

export const Route = createFileRoute("/admin/utilizadores")({ component: UsersAdmin });

const roleLabel: Record<Role, string> = { admin: "Administrador", user: "Utilizador" };

function UsersAdmin() {
  const { user: me } = Route.useRouteContext();
  const users = useQuery(adminQueries.users);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" as Role });

  const create = useAdminMutation(() => api.post<User>("/api/admin/users", form), {
    invalidate: [["admin", "users"]],
    success: "Utilizador criado.",
    onSuccess: () => setForm({ name: "", email: "", password: "", role: "admin" }),
  });
  const update = useAdminMutation(
    ({
      id,
      input,
    }: {
      id: number;
      input: Partial<{ role: Role; active: boolean; password: string }>;
    }) => api.patch<User>(`/api/admin/users/${id}`, input),
    { invalidate: [["admin", "users"]], success: "Utilizador atualizado." },
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate(undefined);
  }

  function resetPassword(u: User) {
    const password = window.prompt(`Nova palavra-passe para ${u.email} (mínimo 10 caracteres):`);
    if (password) update.mutate({ id: u.id, input: { password } });
  }

  return (
    <>
      <AdminSection title="Novo utilizador">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome">
            {(id) => (
              <input
                id={id}
                required
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}
          </Field>
          <Field label="Email">
            {(id) => (
              <input
                id={id}
                type="email"
                required
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            )}
          </Field>
          <Field
            label="Palavra-passe inicial"
            hint="Mínimo 10 caracteres. Partilhe-a por um canal privado."
          >
            {(id) => (
              <input
                id={id}
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                className={inputClass}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            )}
          </Field>
          <Field label="Perfil">
            {(id) => (
              <select
                id={id}
                className={inputClass}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                <option value="admin">{roleLabel.admin}</option>
                <option value="user">{roleLabel.user}</option>
              </select>
            )}
          </Field>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={create.isPending}>
              Criar utilizador
            </Button>
          </div>
        </form>
      </AdminSection>

      <AdminSection title="Utilizadores">
        <QueryState isLoading={users.isLoading} error={users.error} />
        <ul className="grid gap-2">
          {users.data?.map((u) => {
            const self = u.id === me.id;
            return (
              <li
                key={u.id}
                className={`grid gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center ${u.active ? "" : "opacity-60"}`}
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {u.name} {self && <span className="text-muted-foreground">(você)</span>}
                  </p>
                  <p className="truncate text-muted-foreground">
                    {u.email} · {roleLabel[u.role]} · {u.active ? "Ativo" : "Desativado"}
                    {u.lastLoginAt && ` · última entrada ${formatDateTime(u.lastLoginAt)}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={self || update.isPending}
                    onClick={() =>
                      update.mutate({
                        id: u.id,
                        input: { role: u.role === "admin" ? "user" : "admin" },
                      })
                    }
                  >
                    {u.role === "admin" ? "Retirar admin" : "Tornar admin"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={self || update.isPending}
                    onClick={() => update.mutate({ id: u.id, input: { active: !u.active } })}
                  >
                    {u.active ? "Desativar" : "Reativar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={update.isPending}
                    onClick={() => resetPassword(u)}
                  >
                    Nova palavra-passe
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </AdminSection>
    </>
  );
}
