import { queryOptions } from "@tanstack/react-query";

import {
  api,
  type AdminArticle,
  type Club,
  type Competition,
  type Doc,
  type Game,
  type GameDetail,
  type Player,
  type Season,
  type User,
} from "@/lib/api";

export type AdminTransfer = {
  id: number;
  playerId: number;
  playerName: string;
  fromClubId: number | null;
  toClubId: number | null;
  date: string;
  notes: string | null;
  visible: boolean;
};

export type AuditEntry = {
  id: number;
  action: "create" | "update" | "delete";
  entity: string;
  entityId: number | null;
  details: string | null;
  createdAt: string;
  userName: string | null;
};

const list = <T>(resource: string) =>
  queryOptions({
    queryKey: ["admin", resource],
    queryFn: () => api.get<T[]>(`/api/admin/${resource}`),
  });

export const adminQueries = {
  clubs: list<Club>("clubs"),
  competitions: list<Competition>("competitions"),
  seasons: list<Season>("seasons"),
  players: list<Player>("players"),
  transfers: list<AdminTransfer>("transfers"),
  documents: list<Doc>("documents"),
  users: list<User>("users"),
  articles: list<AdminArticle>("articles"),
  audit: list<AuditEntry>("audit"),
  games: (season: number | "current") =>
    queryOptions({
      queryKey: ["admin", "games", season],
      queryFn: () => api.get<Game[]>(`/api/admin/games?season=${season}`),
    }),
  game: (id: number) =>
    queryOptions({
      queryKey: ["admin", "game", id],
      queryFn: () => api.get<GameDetail>(`/api/admin/games/${id}`),
    }),
  article: (id: number) =>
    queryOptions({
      queryKey: ["admin", "article", id],
      queryFn: () => api.get<AdminArticle>(`/api/admin/articles/${id}`),
    }),
};
