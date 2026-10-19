import { Link, Outlet, createFileRoute, redirect, useLocation } from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import { useLogout } from "@/hooks/use-session";
import { sessionQuery, type Role } from "@/lib/api";

const ADMIN_ONLY: readonly Role[] = ["admin"];
const sections: readonly { to: string; label: string; roles: readonly Role[]; exact?: true }[] = [
  { to: "/admin", label: "Painel", roles: ADMIN_ONLY, exact: true },
  { to: "/admin/jogos", label: "Jogos", roles: ["admin", "manager"] },
  { to: "/admin/noticias", label: "Notícias", roles: ADMIN_ONLY },
  { to: "/admin/transferencias", label: "Transferências", roles: ADMIN_ONLY },
  { to: "/admin/jogadores", label: "Jogadores", roles: ADMIN_ONLY },
  { to: "/admin/clubes", label: "Clubes", roles: ADMIN_ONLY },
  { to: "/admin/competicoes", label: "Competições e épocas", roles: ADMIN_ONLY },
  { to: "/admin/documentos", label: "Documentos", roles: ADMIN_ONLY },
  { to: "/admin/utilizadores", label: "Utilizadores", roles: ADMIN_ONLY },
  { to: "/admin/registo", label: "Registo", roles: ADMIN_ONLY },
  { to: "/admin/conta", label: "A minha conta", roles: ["admin", "manager", "user"] },
];

/** The section a path belongs to; unknown paths count as admin-only. */
const sectionFor = (path: string) =>
  sections.find((s) => (s.exact ? path === s.to : path === s.to || path.startsWith(`${s.to}/`)));

// Rendered in the browser only: it depends on the session cookie, and the API
// enforces every permission again on each request.
export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.fetchQuery(sessionQuery);
    if (!user) throw redirect({ to: "/entrar", search: { redirect: location.pathname } });
    // The dashboard is admin-only; managers start on the games.
    if (user.role === "manager" && location.pathname.replace(/\/$/, "") === "/admin") {
      throw redirect({ to: "/admin/jogos" });
    }
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
  const path = useLocation({ select: (l) => l.pathname.replace(/(.)\/$/, "$1") });
  const visible = sections.filter((s) => s.roles.includes(user.role));
  const allowed = sectionFor(path)?.roles.includes(user.role) ?? user.role === "admin";

  return (
    <div className="container-afpg grid gap-8 py-10 lg:grid-cols-[14rem_1fr]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="eyebrow text-primary">{user.role === "user" ? "Conta" : "Administração"}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{user.name}</p>
        <nav className="mt-4 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Administração">
          {visible.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              activeOptions={{ exact: Boolean(s.exact) }}
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
        {allowed ? (
          <Outlet />
        ) : (
          <p className="rounded-xl border border-border bg-card p-6">
            A sua conta ({user.email}) não tem permissões para esta área.
          </p>
        )}
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}
