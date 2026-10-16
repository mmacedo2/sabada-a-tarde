import type { Club } from "@/data/afpg";

const sizes = {
  xs: "size-7",
  sm: "size-10",
  md: "size-14",
  lg: "size-20",
  xl: "size-32",
} as const;

export function Crest({
  club,
  size = "sm",
  className = "",
}: {
  club: Club;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <img
      src={club.crest}
      alt={`Símbolo do ${club.name}`}
      loading="lazy"
      width={768}
      height={768}
      className={`${sizes[size]} shrink-0 object-contain ${className}`}
    />
  );
}
