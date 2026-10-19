import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { Field, errorMessage, inputClass } from "@/components/admin/form";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { api, authProvidersQuery, sessionQuery, type SessionUser } from "@/lib/api";

/** Only internal admin paths, so the redirect cannot send people to another site. */
const safeRedirect = (value: unknown) =>
  typeof value === "string" && /^\/admin(\/[\w\-/]*)?$/.test(value) ? value : "/admin";

/** Codes the API's /api/auth/oidc/callback sends back in `?erro=`. */
const providerErrors: Record<string, string> = {
  cancelado: "O início de sessão foi cancelado.",
  sessao: "O pedido expirou. Tente novamente.",
  email: "A sua conta não tem um email verificado. Verifique-o no fornecedor e tente novamente.",
  inativo: "Esta conta está desativada.",
  oidc: "Não foi possível iniciar sessão. Tente novamente dentro de momentos.",
};

export const Route = createFileRoute("/entrar")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { redirect?: string | undefined; erro?: string | undefined } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
    erro: typeof search["erro"] === "string" ? search["erro"] : undefined,
  }),
  head: () => ({
    meta: [{ title: "Entrar — Sábado à Tarde" }, { name: "robots", content: "noindex" }],
  }),
  component: LoginPage,
});

/** Where a role lands after signing in; matches the API's OIDC callback. */
function landing(user: SessionUser, redirect: string) {
  if (user.role === "admin") return redirect;
  if (user.role === "manager")
    return /^\/admin\/jogos(\/|$)/.test(redirect) ? redirect : "/admin/jogos";
  return "/";
}

function LoginPage() {
  const search = Route.useSearch();
  const redirect = safeRedirect(search.redirect);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const provider = useQuery(authProvidersQuery).data?.oidc ?? null;
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    search.erro ? (providerErrors[search.erro] ?? providerErrors["oidc"]!) : null,
  );
  const [pending, setPending] = useState(false);
  const registering = mode === "register";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const user = registering
        ? await api.post<SessionUser>("/api/auth/register", { name, email, password })
        : await api.post<SessionUser>("/api/auth/login", { email, password });
      queryClient.setQueryData(sessionQuery.queryKey, user);
      await navigate({ href: landing(user, redirect) });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError(null);
  }

  return (
    <>
      <PageHeader
        eyebrow="A sua conta"
        title={registering ? "Criar conta" : "Entrar"}
        description={
          provider
            ? `Entre com a sua conta ${provider.name} ou com email. Com ${provider.name}, a conta é criada na primeira vez.`
            : "Entre com o seu email, ou crie uma conta."
        }
      />
      <section className="container-afpg py-14">
        <form
          onSubmit={submit}
          className="mx-auto grid max-w-sm gap-5 rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <div role="tablist" className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`rounded px-3 py-1.5 text-sm transition-colors ${mode === m ? "bg-card font-semibold shadow-card" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>
          {provider && (
            <>
              {/* A full navigation: the API redirects to the provider and back. */}
              <Button asChild variant="outline">
                <a href={`/api/auth/oidc/start?redirect=${encodeURIComponent(redirect)}`}>
                  Continuar com {provider.name}
                </a>
              </Button>
              <p className="eyebrow flex items-center gap-3 text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
                ou com email
              </p>
            </>
          )}
          {registering && (
            <Field label="Nome">
              {(id) => (
                <input
                  id={id}
                  autoComplete="name"
                  required
                  maxLength={120}
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
            </Field>
          )}
          <Field label="Email">
            {(id) => (
              <input
                id={id}
                type="email"
                autoComplete={registering ? "email" : "username"}
                required
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </Field>
          <Field label="Palavra-passe" {...(registering ? { hint: "Mínimo 10 caracteres." } : {})}>
            {(id) => (
              <input
                id={id}
                type="password"
                autoComplete={registering ? "new-password" : "current-password"}
                required
                minLength={registering ? 10 : undefined}
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
            {registering
              ? pending
                ? "A criar conta…"
                : "Criar conta"
              : pending
                ? "A entrar…"
                : "Entrar"}
          </Button>
        </form>
      </section>
    </>
  );
}
