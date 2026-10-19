import type { Club } from "@/lib/api";

const sizes = {
  xs: "size-7 text-[0.55rem]",
  sm: "size-10 text-xs",
  md: "size-14 text-sm",
  lg: "size-20 text-base",
  xl: "size-32 text-2xl",
} as const;

export function Crest({
  club,
  size = "sm",
  className = "",
}: {
  club: Pick<Club, "name" | "crestUrl" | "initials" | "shortName">;
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (!club.crestUrl) {
    return (
      <span
        aria-label={`Símbolo do ${club.name}`}
        className={`${sizes[size]} stat inline-flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ${className}`}
      >
        {club.initials ?? club.shortName.slice(0, 3).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={club.crestUrl}
      alt={`Símbolo do ${club.name}`}
      loading="lazy"
      width={768}
      height={768}
      className={`${sizes[size]} shrink-0 object-contain ${className}`}
    />
  );
}
