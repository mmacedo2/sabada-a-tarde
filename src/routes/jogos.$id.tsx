import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { AdminEditLink } from "@/components/site/AdminEditLink";
import { Crest } from "@/components/site/Crest";
import { formatDate } from "@/data/afpg";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import {
  ApiError,
  api,
  hasScore,
  isLive,
  statusLabel,
  type GameDetail,
  type GameEvent,
} from "@/lib/api";
import { useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/jogos/$id")({
  loader: async ({ params }) => {
    if (!/^\d+$/.test(params.id)) throw notFound();
    try {
      return await api.get<GameDetail>(`/api/games/${params.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Jogo — Sábado à Tarde" }] };
    const g = loaderData;
    const home = g.home ?? g.homePlaceholder ?? "—";
    const away = g.away ?? g.awayPlaceholder ?? "—";
    const score = hasScore(g) && g.status !== "scheduled" ? `${g.homeGoals}–${g.awayGoals}` : "vs";
    return { meta: [{ title: `${home} ${score} ${away} · ${g.round} — Sábado à Tarde` }] };
  },
  component: GamePage,
});

type Side = "home" | "away";

/** An own goal is recorded against the scorer's club but counts for the other side. */
function sideOf(event: GameEvent, game: GameDetail): Side {
  const playerSide: Side = event.clubId === game.homeClubId ? "home" : "away";
  if (event.type !== "own_goal") return playerSide;
  return playerSide === "home" ? "away" : "home";
}

const isGoal = (e: GameEvent) =>
  e.type === "goal" || e.type === "penalty_goal" || e.type === "own_goal";
const isCard = (e: GameEvent) => e.type === "yellow_card" || e.type === "red_card";

function GamePage() {
  const game = Route.useLoaderData();
  const { clubBySlug, competitionBySlug } = useCatalog();
  const live = isLive(game);
  useLiveRefresh(live);

  const competition = competitionBySlug(game.competition);
  const showScore = hasScore(game) && game.status !== "scheduled";
  const goals = game.events.filter(isGoal);
  const cards = game.events.filter(isCard);
  const bySide = (events: GameEvent[], side: Side) =>
    events.filter((e) => sideOf(e, game) === side);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        <div className="container-afpg py-12 md:py-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow text-primary">
              {[...new Set([competition?.name, game.round, game.stage].filter(Boolean))].join(
                " · ",
              )}
            </p>
            <span
              className={`eyebrow inline-flex items-center gap-1.5 ${live ? "text-destructive" : "text-ink-muted"}`}
            >
              {live && (
                <span
                  className="size-2 animate-pulse rounded-full bg-destructive"
                  aria-hidden="true"
                />
              )}
              {statusLabel[game.status]}
            </span>
          </div>

          <div className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-10">
            <Team slug={game.home} placeholder={game.homePlaceholder} clubBySlug={clubBySlug} />
            <div className="text-center">
              {showScore ? (
                <p className="stat text-5xl leading-none md:text-7xl">
                  {game.homeGoals}
                  <span className="mx-2 text-ink-muted md:mx-4">—</span>
                  {game.awayGoals}
                </p>
              ) : (
                <p className="stat text-3xl leading-none text-primary md:text-5xl">
                  {game.kickoffTime ?? "—"}
                </p>
              )}
              {game.homePenalties != null && game.awayPenalties != null && (
                <p className="mt-2 text-sm text-ink-muted">
                  g.p. {game.homePenalties}–{game.awayPenalties}
                </p>
              )}
            </div>
            <Team slug={game.away} placeholder={game.awayPlaceholder} clubBySlug={clubBySlug} />
          </div>

          <p className="mt-10 text-center text-sm text-ink-muted">
            {[formatDate(game.date), showScore ? game.kickoffTime : null, game.venue]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="mt-5 flex justify-center empty:hidden">
            <AdminEditLink
              label="Gerir jogo"
              forManagers
              to="/admin/jogos/$id"
              params={{ id: String(game.id) }}
            />
          </div>
        </div>
      </section>

      <section className="container-afpg grid gap-10 py-12 md:py-16">
        {goals.length > 0 && (
          <EventColumns title="Golos" home={bySide(goals, "home")} away={bySide(goals, "away")} />
        )}
        {cards.length > 0 && (
          <EventColumns title="Cartões" home={bySide(cards, "home")} away={bySide(cards, "away")} />
        )}
        {game.notes && (
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase">Notas</h2>
            <p className="mt-3 whitespace-pre-line text-muted-foreground">{game.notes}</p>
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-3">
          <Link to="/resultados" className="eyebrow text-primary hover:underline">
            ← Todos os resultados
          </Link>
          {competition && (
            <Link
              to="/$competition"
              params={{ competition: competition.slug }}
              className="eyebrow text-primary hover:underline"
            >
              {competition.name} →
            </Link>
          )}
        </div>
      </section>
    </>
  );
}

function Team({
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
      <p className="text-center font-display text-lg font-bold text-ink-muted md:text-2xl">
        {placeholder ?? "—"}
      </p>
    );
  }
  return (
    <Link
      to="/clubes/$slug"
      params={{ slug: club.slug }}
      className="flex flex-col items-center gap-3 text-center"
    >
      {/* A light tile, so dark crests stay visible on the dark header. */}
      <span className="rounded-2xl bg-white p-2 shadow-card">
        <Crest club={club} size="lg" />
      </span>
      <span className="font-display text-lg font-bold uppercase leading-tight md:text-2xl">
        {club.name}
      </span>
    </Link>
  );
}

function EventColumns({
  title,
  home,
  away,
}: {
  title: string;
  home: GameEvent[];
  away: GameEvent[];
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-extrabold uppercase">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
        <EventList events={home} />
        <EventList events={away} align="right" />
      </div>
    </div>
  );
}

const typeNote: Partial<Record<GameEvent["type"], { short: string; long: string }>> = {
  penalty_goal: { short: "g.p.", long: "grande penalidade" },
  own_goal: { short: "p.b.", long: "própria baliza" },
};

function EventList({ events, align = "left" }: { events: GameEvent[]; align?: "left" | "right" }) {
  return (
    <ul className={`grid content-start gap-2 text-sm ${align === "right" ? "text-right" : ""}`}>
      {events.map((e) => {
        const note = typeNote[e.type];
        return (
          <li
            key={e.id}
            className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}
          >
            {(e.type === "yellow_card" || e.type === "red_card") && (
              <span
                aria-label={e.type === "red_card" ? "Cartão vermelho" : "Cartão amarelo"}
                className={`inline-block h-4 w-3 shrink-0 rounded-[2px] ${e.type === "red_card" ? "bg-destructive" : "bg-yellow-400"}`}
              />
            )}
            {e.minute != null && <span className="stat text-muted-foreground">{e.minute}'</span>}
            <span className="font-semibold">{e.playerName}</span>
            {note && (
              <abbr title={note.long} className="text-muted-foreground no-underline">
                ({note.short})
              </abbr>
            )}
          </li>
        );
      })}
    </ul>
  );
}
