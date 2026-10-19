import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import { useLogout } from "@/hooks/use-session";
import { sessionQuery } from "@/lib/api";

const sections = [
  { to: "/admin", label: "Painel", exact: true },
  { to: "/admin/jogos", label: "Jogos" },
  { to: "/admin/noticias", label: "Notícias" },
  { to: "/admin/transferencias", label: "Transferências" },
  { to: "/admin/jogadores", label: "Jogadores" },
  { to: "/admin/clubes", label: "Clubes" },
  { to: "/admin/competicoes", label: "Competições e épocas" },
  { to: "/admin/documentos", label: "Documentos" },
  { to: "/admin/utilizadores", label: "Utilizadores" },
  { to: "/admin/registo", label: "Registo" },
  { to: "/admin/conta", label: "A minha conta" },
] as const;

// Rendered in the browser only: it depends on the session cookie, and the API
// enforces every permission again on each request.
export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.fetchQuery(sessionQuery);
    if (!user) throw redirect({ to: "/entrar", search: { redirect: location.pathname } });
    return { user };
  },
  head: () => ({
    meta: [{ title: "Administração — Sábado à Tarde" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const logout = useLogout();

  if (user.role !== "admin") {
    return (
      <section className="container-afpg py-16">
        <p className="rounded-xl border border-border bg-card p-6">
          A sua conta ({user.email}) não tem permissões de administração.{" "}
          <button type="button" onClick={logout} className="text-primary hover:underline">
            Terminar sessão
          </button>
        </p>
      </section>
    );
  }

  return (
    <div className="container-afpg grid gap-8 py-10 lg:grid-cols-[14rem_1fr]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="eyebrow text-primary">Administração</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{user.name}</p>
        <nav className="mt-4 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Administração">
          {sections.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              activeOptions={{ exact: "exact" in s }}
              className="shrink-0 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              activeProps={{
                className:
                  "shrink-0 rounded-md px-3 py-2 text-sm bg-primary text-primary-foreground",
              }}
            >
              {s.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={logout}
            className="shrink-0 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
          >
            Terminar sessão
          </button>
        </nav>
      </aside>
      <div className="min-w-0 space-y-8">
        <Outlet />
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}
