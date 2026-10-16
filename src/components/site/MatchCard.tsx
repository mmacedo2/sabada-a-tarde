import { Link } from "@tanstack/react-router";

import { AdminEditLink } from "@/components/site/AdminEditLink";
import { Crest } from "@/components/site/Crest";
import { formatDate } from "@/data/afpg";
import { hasScore, isLive, statusLabel, type Game } from "@/lib/api";
import { useCatalog } from "@/lib/catalog";

export function MatchCard({ match }: { match: Game }) {
  const { clubBySlug, competitionBySlug } = useCatalog();
  const competition = competitionBySlug(match.competition);
  const live = isLive(match);
  const showScore = hasScore(match) && match.status !== "scheduled";
  const note =
    match.status === "postponed" || match.status === "cancelled" ? statusLabel[match.status] : null;

  return (
    <article className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <header className="flex items-center justify-between gap-3">
        <span className="eyebrow text-primary">{competition?.name}</span>
        {live ? (
          <span className="eyebrow inline-flex items-center gap-1.5 text-destructive">
            <span className="size-2 animate-pulse rounded-full bg-destructive" aria-hidden="true" />
            {statusLabel[match.status]}
          </span>
        ) : (
          <span className="eyebrow text-muted-foreground">
            {match.stage ? `${match.round} · ${match.stage}` : match.round}
          </span>
        )}
      </header>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Side slug={match.home} placeholder={match.homePlaceholder} clubBySlug={clubBySlug} />

        <div className="min-w-20 text-center">
          {showScore ? (
            <p className="stat text-4xl leading-none">
              {match.homeGoals}
              <span className="mx-1.5 text-muted-foreground">—</span>
              {match.awayGoals}
            </p>
          ) : (
            <p className="stat text-2xl leading-none text-primary">{match.kickoffTime ?? "—"}</p>
          )}
          {match.homePenalties != null && match.awayPenalties != null && (
            <p className="mt-1 text-xs text-muted-foreground">
              g.p. {match.homePenalties}–{match.awayPenalties}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{formatDate(match.date)}</p>
          {note && <p className="eyebrow mt-1 text-destructive">{note}</p>}
        </div>

        <Side slug={match.away} placeholder={match.awayPlaceholder} clubBySlug={clubBySlug} />
      </div>

      {match.venue && (
        <p className="mt-5 border-t border-border pt-3 text-center text-xs text-muted-foreground">
          {match.venue}
        </p>
      )}
      <div className="mt-4 flex justify-center empty:hidden">
        <AdminEditLink label="Gerir jogo" to="/admin/jogos/$id" params={{ id: String(match.id) }} />
      </div>
    </article>
  );
}

function Side({
  slug,
  placeholder,
  clubBySlug,
}: {
  slug: string | null;
  placeholder: string | null;
  clubBySlug: ReturnType<typeof useCatalog>["clubBySlug"];
}) {
  const club = clubBySlug(slug);
  if (!club) {
    return (
      <span className="text-center text-sm font-semibold leading-tight text-muted-foreground">
        {placeholder ?? "—"}
      </span>
    );
  }
  return (
    <Link
      to="/clubes/$slug"
      params={{ slug: club.slug }}
      className="flex flex-col items-center gap-2 text-center"
    >
      <Crest club={club} size="md" className="transition-transform group-hover:scale-105" />
      <span className="text-sm font-semibold leading-tight">{club.shortName}</span>
    </Link>
  );
}
