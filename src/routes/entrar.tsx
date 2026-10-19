import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { Field, errorMessage, inputClass } from "@/components/admin/form";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { api, sessionQuery, type SessionUser } from "@/lib/api";

/** Only internal admin paths, so the redirect cannot send people to another site. */
const safeRedirect = (value: unknown) =>
  typeof value === "string" && /^\/admin(\/[\w\-/]*)?$/.test(value) ? value : "/admin";

export const Route = createFileRoute("/entrar")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [{ title: "Entrar — Sábado à Tarde" }, { name: "robots", content: "noindex" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const redirect = safeRedirect(Route.useSearch().redirect);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const user = await api.post<SessionUser>("/api/auth/login", { email, password });
      queryClient.setQueryData(sessionQuery.queryKey, user);
      await navigate({ href: user.role === "admin" ? redirect : "/" });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Área reservada"
        title="Entrar"
        description="Acesso para a equipa editorial."
      />
      <section className="container-afpg py-14">
        <form
          onSubmit={submit}
          className="mx-auto grid max-w-sm gap-5 rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <Field label="Email">
            {(id) => (
              <input
                id={id}
                type="email"
                autoComplete="username"
                required
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </Field>
          <Field label="Palavra-passe">
            {(id) => (
              <input
                id={id}
                type="password"
                autoComplete="current-password"
                required
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "A entrar…" : "Entrar"}
          </Button>
        </form>
      </section>
    </>
  );
}
