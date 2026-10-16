import { Link, type LinkProps } from "@tanstack/react-router";

import { useSession } from "@/hooks/use-session";

/** Shortcut from a public page to its admin screen, shown only to admins. */
export function AdminEditLink({
  label,
  className = "",
  ...link
}: LinkProps & { label: string; className?: string }) {
  const { isAdmin } = useSession();
  if (!isAdmin) return null;
  return (
    <Link
      {...link}
      className={`eyebrow inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-primary transition-colors hover:bg-primary hover:text-primary-foreground ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
      {label}
    </Link>
  );
}
