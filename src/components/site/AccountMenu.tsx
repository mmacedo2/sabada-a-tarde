import { Link } from "@tanstack/react-router";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout, useSession } from "@/hooks/use-session";

/** "Entrar" when signed out; otherwise a menu with what the role can open, and logout. */
export function AccountMenu() {
  const { user, isAdmin, canEditGames, isPending } = useSession();
  const logout = useLogout();

  // Nothing until the browser knows, so the button never flips from "Entrar" to the user.
  if (isPending) return <span className="inline-block size-11" aria-hidden="true" />;

  if (!user) {
    return (
      <Link
        to="/entrar"
        className="eyebrow inline-flex min-h-11 items-center rounded-md border border-ink-border px-4 text-ink-foreground transition-colors hover:bg-white/10"
      >
        Entrar
      </Link>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Conta de ${user.name}`}
        className="stat inline-flex size-11 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground ring-offset-ink transition-colors hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate">{user.name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin">Administração</Link>
          </DropdownMenuItem>
        )}
        {canEditGames && !isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin/jogos">Gerir jogos</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/admin/conta">A minha conta</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void logout()}>Terminar sessão</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
