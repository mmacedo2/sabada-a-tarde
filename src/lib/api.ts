import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";

/* ---------- Types (mirror api/src: camelCase, booleans) ---------- */

export type Season = {
  id: number;
  name: string;
  startsOn: string;
  endsOn: string;
  isCurrent: boolean;
};

export type Club = {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  initials: string | null;
  locality: string | null;
  crestUrl: string | null;
  color: string | null;
  colorLabel: string | null;
  foundedOn: string | null;
  website: string | null;
  visible?: boolean;
};

export type CompetitionKind = "league" | "cup" | "award";

export type Competition = {
  id: number;
  slug: string;
  name: string;
  kind: CompetitionKind;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  sourceUrl: string | null;
  position: number;
  visible?: boolean;
};

export type Catalog = { seasons: Season[]; clubs: Club[]; competitions: Competition[] };

export type GameStatus = "scheduled" | "live" | "halftime" | "finished" | "postponed" | "cancelled";

export type Game = {
  id: number;
  seasonId: number;
  competitionId: number;
  competition: string;
  round: string;
  stage: string | null;
  homeClubId: number | null;
  home: string | null;
  homePlaceholder: string | null;
  awayClubId: number | null;
  away: string | null;
  awayPlaceholder: string | null;
  date: string;
  kickoffTime: string | null;
  venue: string | null;
  status: GameStatus;
  homeGoals: number | null;
  awayGoals: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  notes: string | null;
  visible: boolean;
  updatedAt: string;
};

export type GameEventType = "goal" | "penalty_goal" | "own_goal" | "yellow_card" | "red_card";

export type GameEvent = {
  id: number;
  type: GameEventType;
  minute: number | null;
  clubId: number;
  playerId: number | null;
  playerName: string | null;
};

export type GameDetail = Game & { events: GameEvent[] };

export type StandingRow = {
  position: number;
  club: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export type ArticleKind = "news" | "announcement";

export type ArticleSummary = {
  id: number;
  slug: string;
  kind: ArticleKind;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  publishedAt: string;
};

export type Article = ArticleSummary & {
  body: string;
  updatedAt: string;
  authorName: string | null;
};

export type AdminArticle = {
  id: number;
  slug: string;
  kind: ArticleKind;
  title: string;
  summary: string | null;
  body: string;
  coverUrl: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  updatedAt: string;
  authorName: string | null;
};

export type Doc = {
  id: number;
  title: string;
  category: string;
  url: string;
  publishedOn: string | null;
  visible?: boolean;
};

export type Transfer = {
  id: number;
  date: string;
  notes: string | null;
  playerId: number;
  playerName: string;
  playerNickname: string | null;
  playerPosition: PlayerPosition | null;
  fromClub: string | null;
  toClub: string | null;
};

export type PlayerPosition = "goalkeeper" | "defender" | "midfielder" | "forward";

export type Player = {
  id: number;
  name: string;
  nickname: string | null;
  position: PlayerPosition | null;
  clubId: number | null;
  photoUrl: string | null;
  birthDate: string | null;
  visible: boolean;
};

export type Role = "admin" | "user";
export type SessionUser = { id: number; email: string; name: string; role: Role };
export type User = SessionUser & { active: boolean; lastLoginAt: string | null; createdAt: string };

/* ---------- Transport ---------- */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type ServiceBinding = { fetch(request: Request): Promise<Response> };

/**
 * Browser: same-origin /api. SSR on Cloudflare: the API service binding. SSR in
 * `vite dev`: the local API (API_ORIGIN, default http://127.0.0.1:8787).
 */
const send = createIsomorphicFn()
  .server(async (path: string, init: RequestInit): Promise<Response> => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const incoming = getRequest() as Request & {
      runtime?: { cloudflare?: { env?: { API?: ServiceBinding } } };
    };
    const binding = incoming.runtime?.cloudflare?.env?.API;
    if (binding) return binding.fetch(new Request(new URL(path, incoming.url), init));
    return fetch(new URL(path, process.env["API_ORIGIN"] ?? "http://127.0.0.1:8787"), init);
  })
  .client((path: string, init: RequestInit) =>
    fetch(path, { credentials: "same-origin", ...init }),
  );

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await send(path, init);
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : `Pedido falhou (${response.status}).`;
    throw new ApiError(response.status, message);
  }
  return data as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: body === undefined ? null : JSON.stringify(body),
});

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, json("POST", body)),
  patch: <T>(path: string, body: unknown) => request<T>(path, json("PATCH", body)),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string }>("/api/admin/uploads", { method: "POST", body: form });
  },
};

/* ---------- Shared queries ---------- */

export const CATALOG_STALE_MS = 5 * 60 * 1000;

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => api.get<Catalog>("/api/catalog"),
  staleTime: CATALOG_STALE_MS,
});

export const authProvidersQuery = queryOptions({
  queryKey: ["auth-providers"],
  queryFn: () => api.get<{ oidc: { name: string } | null }>("/api/auth/providers"),
  staleTime: Infinity,
});

export const sessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: () => api.get<SessionUser | null>("/api/auth/me"),
  staleTime: 60 * 1000,
});

/** The league shown on the home page, standings and club pages: the first league by menu order. */
export async function loadMainLeague(queryClient: QueryClient) {
  const catalog = await queryClient.ensureQueryData(catalogQuery);
  const league = catalog.competitions.find((c) => c.kind === "league") ?? null;
  const standings = league
    ? await api.get<StandingRow[]>(`/api/standings/${encodeURIComponent(league.slug)}`)
    : [];
  return { league, standings };
}

export const leagueLabel = (league: Competition) =>
  league.tagline ? `${league.name} · ${league.tagline}` : league.name;

/* ---------- Game helpers ---------- */

export const LIVE_STATUSES: readonly GameStatus[] = ["live", "halftime"];
export const isLive = (g: Game) => LIVE_STATUSES.includes(g.status);
export const isPlayed = (g: Game) => g.status === "finished";
export const hasScore = (g: Game) => g.homeGoals != null && g.awayGoals != null;

export const byDateAsc = (a: Game, b: Game) =>
  a.date.localeCompare(b.date) ||
  (a.kickoffTime ?? "").localeCompare(b.kickoffTime ?? "") ||
  a.id - b.id;
export const byDateDesc = (a: Game, b: Game) => byDateAsc(b, a);

export const statusLabel: Record<GameStatus, string> = {
  scheduled: "Agendado",
  live: "Ao vivo",
  halftime: "Intervalo",
  finished: "Terminado",
  postponed: "Adiado",
  cancelled: "Cancelado",
};

export const competitionKindLabel: Record<CompetitionKind, string> = {
  league: "Liga",
  cup: "Taça",
  award: "Prémio",
};
