import { Link } from "@tanstack/react-router";

import { Crest } from "@/components/site/Crest";
import {
  clubBySlug,
  competitionBySlug,
  formatDate,
  type Match,
} from "@/data/afpg";

export function MatchCard({ match }: { match: Match }) {
  const home = clubBySlug(match.home);
  const away = clubBySlug(match.away);
  const competition = competitionBySlug(match.competition);
  if (!home || !away) return null;

  const played = match.homeGoals !== undefined;

  return (
    <article className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <header className="flex items-center justify-between gap-3">
        <span className="eyebrow text-primary">{competition?.name}</span>
        <span className="eyebrow text-muted-foreground">{match.round}</span>
      </header>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Link to="/clubes/$slug" params={{ slug: home.slug }} className="flex flex-col items-center gap-2 text-center">
          <Crest club={home} size="md" className="transition-transform group-hover:scale-105" />
          <span className="text-sm font-semibold leading-tight">{home.short}</span>
        </Link>

        <div className="min-w-20 text-center">
          {played ? (
            <p className="stat text-4xl leading-none">
              {match.homeGoals}
              <span className="mx-1.5 text-muted-foreground">—</span>
              {match.awayGoals}
            </p>
          ) : (
            <p className="stat text-2xl leading-none text-primary">{match.time ?? "—"}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{formatDate(match.date)}</p>
        </div>

        <Link to="/clubes/$slug" params={{ slug: away.slug }} className="flex flex-col items-center gap-2 text-center">
          <Crest club={away} size="md" className="transition-transform group-hover:scale-105" />
          <span className="text-sm font-semibold leading-tight">{away.short}</span>
        </Link>
      </div>

      {match.venue && (
        <p className="mt-5 border-t border-border pt-3 text-center text-xs text-muted-foreground">
          {match.venue}
        </p>
      )}
    </article>
  );
}
