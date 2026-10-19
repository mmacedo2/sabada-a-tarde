import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { AdminSection, Field, inputClass, useAdminMutation } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/conta")({ component: AccountPage });

function AccountPage() {
  const { user } = Route.useRouteContext();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const change = useAdminMutation(
    () => api.post("/api/auth/password", { currentPassword, newPassword }),
    {
      success: "Palavra-passe alterada. As outras sessões foram terminadas.",
      onSuccess: () => {
        setCurrent("");
        setNew("");
        setConfirm("");
      },
    },
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    change.mutate(undefined);
  }

  return (
    <AdminSection title="A minha conta">
      <p className="mb-6 text-sm text-muted-foreground">
        {user.name} · {user.email}
      </p>
      <form onSubmit={submit} className="grid max-w-sm gap-4">
        <Field label="Palavra-passe atual">
          {(id) => (
            <input
              id={id}
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
            />
          )}
        </Field>
        <Field label="Nova palavra-passe" hint="Mínimo 10 caracteres.">
          {(id) => (
            <input
              id={id}
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNew(e.target.value)}
            />
          )}
        </Field>
        <Field label="Repetir nova palavra-passe">
          {(id) => (
            <input
              id={id}
              type="password"
              autoComplete="new-password"
              required
              className={inputClass}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}
        </Field>
        {confirm && confirm !== newPassword && (
          <p className="text-sm text-destructive">As palavras-passe não coincidem.</p>
        )}
        <Button type="submit" disabled={change.isPending || confirm !== newPassword}>
          Alterar palavra-passe
        </Button>
      </form>
    </AdminSection>
  );
}
