import { Link } from "@tanstack/react-router";

import { Crest } from "@/components/site/Crest";
import { clubBySlug, type StandingRow } from "@/data/afpg";

export function StandingsTable({
  rows,
  compact = false,
}: {
  rows: StandingRow[];
  compact?: boolean;
}) {
  return (
    <div className="-mx-5 overflow-x-auto rounded-none border-y border-border bg-card shadow-card sm:mx-0 sm:overflow-hidden sm:rounded-xl sm:border">
      <table className="w-full min-w-full border-collapse text-sm">
        <caption className="sr-only">Classificação da Super Liga AFPG</caption>
        <thead>
          <tr className="bg-ink text-ink-foreground">
            <th scope="col" className="eyebrow px-3 py-3 text-left">#</th>
            <th scope="col" className="eyebrow px-2 py-3 text-left">Equipa</th>
            <th scope="col" className="eyebrow px-2 py-3 text-center">J</th>
            {!compact && (
              <>
                <th scope="col" className="eyebrow hidden px-2 py-3 text-center xs:table-cell">V</th>
                <th scope="col" className="eyebrow hidden px-2 py-3 text-center xs:table-cell">E</th>
                <th scope="col" className="eyebrow hidden px-2 py-3 text-center xs:table-cell">D</th>
                <th scope="col" className="eyebrow hidden px-2 py-3 text-center sm:table-cell">GM</th>
                <th scope="col" className="eyebrow hidden px-2 py-3 text-center sm:table-cell">GS</th>
              </>
            )}
            <th scope="col" className="eyebrow hidden px-2 py-3 text-center xs:table-cell">DIF</th>
            <th scope="col" className="eyebrow px-3 py-3 text-center">PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const club = clubBySlug(row.club);
            if (!club) return null;
            const diff = row.goalsFor - row.goalsAgainst;
            return (
              <tr key={row.club} className="border-t border-border transition-colors hover:bg-muted">
                <td className="px-3 py-3">
                  <span
                    className={`stat inline-flex size-7 items-center justify-center rounded-md text-sm ${
                      row.position === 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {row.position}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <Link
                    to="/clubes/$slug"
                    params={{ slug: club.slug }}
                    className="flex items-center gap-2.5 font-semibold hover:text-primary"
                  >
                    <Crest club={club} size="xs" />
                    <span className="truncate">{club.short}</span>
                  </Link>
                </td>
                <td className="stat px-2 py-3 text-center">{row.played}</td>
                {!compact && (
                  <>
                    <td className="stat hidden px-2 py-3 text-center xs:table-cell">{row.wins}</td>
                    <td className="stat hidden px-2 py-3 text-center xs:table-cell">{row.draws}</td>
                    <td className="stat hidden px-2 py-3 text-center xs:table-cell">{row.losses}</td>
                    <td className="stat hidden px-2 py-3 text-center sm:table-cell">{row.goalsFor}</td>
                    <td className="stat hidden px-2 py-3 text-center sm:table-cell">{row.goalsAgainst}</td>
                  </>
                )}
                <td className="stat hidden px-2 py-3 text-center text-muted-foreground xs:table-cell">
                  {diff > 0 ? `+${diff}` : diff}
                </td>
                <td className="stat px-3 py-3 text-center text-lg text-primary">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
