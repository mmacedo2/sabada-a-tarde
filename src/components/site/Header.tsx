import { Link } from "@tanstack/react-router";
import { useState } from "react";

import logo from "@/assets/sabado-logo.png";
import { AccountMenu } from "@/components/site/AccountMenu";
import { useLogout, useSession } from "@/hooks/use-session";
import { useCatalog } from "@/lib/catalog";

const nav = [
  { label: "Início", to: "/" },
  { label: "Equipas", to: "/clubes" },
  { label: "Resultados", to: "/resultados" },
  { label: "Classificações", to: "/classificacoes" },
  { label: "Notícias", to: "/noticias" },
  { label: "Transferências", to: "/transferencias" },
  { label: "Documentos", to: "/documentos" },
  { label: "A AFPG", to: "/associacao" },
  { label: "Contactos", to: "/contactos" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { competitions } = useCatalog();
  const { user, isAdmin } = useSession();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-50 border-b border-ink-border bg-ink text-ink-foreground">
      <div className="container-afpg flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img
            src={logo}
            alt="Sábado à Tarde"
            width={1024}
            height={1024}
            className="size-10 object-contain lg:size-12"
          />
          <span className="hidden leading-none sm:block">
            <span className="block font-display text-base font-extrabold tracking-tight">
              Sábado à Tarde
            </span>
            <span className="eyebrow block text-[0.6rem] text-ink-muted">
              Futebol Popular de Guimarães
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Navegação principal">
          <div className="group relative">
            <button className="eyebrow rounded-md px-3 py-2 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink-foreground">
              Competições
            </button>
            <div className="invisible absolute left-0 top-full w-64 translate-y-1 rounded-lg border border-ink-border bg-ink p-2 opacity-0 shadow-lift transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              {competitions.map((c) => (
                <Link
                  key={c.slug}
                  to="/$competition"
                  params={{ competition: c.slug }}
                  className="block rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink-foreground"
                >
                  {c.name}
                  <span className="block text-xs text-ink-muted/70">{c.tagline}</span>
                </Link>
              ))}
            </div>
          </div>
          {nav.slice(1).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="eyebrow rounded-md px-3 py-2 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink-foreground"
              activeProps={{
                className: "eyebrow rounded-md px-3 py-2 text-ink-foreground bg-white/10",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/classificacoes"
            className="eyebrow hidden rounded-md bg-primary px-4 py-2.5 text-primary-foreground transition-colors hover:bg-primary-deep sm:inline-flex xl:hidden"
          >
            Classificações
          </Link>
          <AccountMenu />
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-ink-border text-ink-foreground xl:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-border bg-ink xl:hidden">
          <nav className="container-afpg grid gap-1 py-4" aria-label="Navegação móvel">
            <p className="eyebrow px-3 pt-2 text-primary">Competições</p>
            {competitions.map((c) => (
              <Link
                key={c.slug}
                to="/$competition"
                params={{ competition: c.slug }}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base text-ink-muted transition-colors hover:bg-white/5 hover:text-ink-foreground"
              >
                {c.name}
              </Link>
            ))}
            <p className="eyebrow px-3 pt-4 text-primary">Navegação</p>
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base text-ink-muted transition-colors hover:bg-white/5 hover:text-ink-foreground"
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <p className="eyebrow px-3 pt-4 text-primary">{user.name}</p>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base text-ink-muted transition-colors hover:bg-white/5 hover:text-ink-foreground"
                  >
                    Administração
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                  className="rounded-md px-3 py-3 text-left text-base text-ink-muted transition-colors hover:bg-white/5 hover:text-ink-foreground"
                >
                  Terminar sessão
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
