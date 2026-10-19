import { Hono } from "hono";

import type { AppEnv } from "../env";
import { allToApi, toApi } from "../lib/db";
import { HttpError, notFound, parseId } from "../lib/http";
import { gamesQuery, resolveSeasonId } from "../lib/queries";
import { computeStandings, type StandingsGame } from "../lib/standings";
import { gameStatuses } from "../schemas";

export const publicRoutes = new Hono<AppEnv>();

// Short browser cache: fresh enough for live scores polled every ~20s.
publicRoutes.use(async (c, next) => {
  await next();
  if (c.res.status === 200 && !c.res.headers.has("cache-control")) {
    c.header("Cache-Control", "public, max-age=10");
  }
});

/** Data almost every page needs, fetched once by the root route. */
publicRoutes.get("/catalog", async (c) => {
  const [seasons, clubs, competitions] = await c.env.DB.batch([
    c.env.DB.prepare(
      "SELECT id, name, starts_on, ends_on, is_current FROM seasons ORDER BY starts_on DESC",
    ),
    c.env.DB.prepare(
      `SELECT id, slug, name, short_name, initials, locality, crest_url, color, color_label, founded_on, website
         FROM clubs WHERE visible = 1 ORDER BY name`,
    ),
    c.env.DB.prepare(
      `SELECT id, slug, name, kind, tagline, description, logo_url, source_url, position
         FROM competitions WHERE visible = 1 ORDER BY position, name`,
    ),
  ]);
  return c.json({
    seasons: allToApi(seasons!.results as Record<string, unknown>[]),
    clubs: allToApi(clubs!.results as Record<string, unknown>[]),
    competitions: allToApi(competitions!.results as Record<string, unknown>[]),
  });
});

publicRoutes.get("/games", async (c) => {
  const status = c.req.query("status")?.split(",").filter(Boolean);
  if (status?.some((s) => !(gameStatuses as readonly string[]).includes(s))) {
    throw new HttpError(400, "Estado de jogo inválido.");
  }
  const { results } = await gamesQuery(c.env.DB, {
    seasonId: await resolveSeasonId(c.env.DB, c.req.query("season")),
    competition: c.req.query("competition"),
    club: c.req.query("club"),
    status,
  }).all();
  return c.json(allToApi(results));
});

publicRoutes.get("/games/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const [games, events] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT g.*, co.slug AS competition, hc.slug AS home, ac.slug AS away
         FROM games g
         JOIN competitions co ON co.id = g.competition_id
         LEFT JOIN clubs hc ON hc.id = g.home_club_id
         LEFT JOIN clubs ac ON ac.id = g.away_club_id
        WHERE g.id = ? AND g.visible = 1`,
    ).bind(id),
    c.env.DB.prepare(
      `SELECT e.id, e.type, e.minute, e.club_id, cl.slug AS club, e.player_id,
              COALESCE(p.nickname, p.name, e.player_name) AS player_name
         FROM game_events e
         JOIN clubs cl ON cl.id = e.club_id
         LEFT JOIN players p ON p.id = e.player_id
        WHERE e.game_id = ?
        ORDER BY e.minute IS NULL, e.minute, e.id`,
    ).bind(id),
  ]);
  const game = games!.results[0] as Record<string, unknown> | undefined;
  if (!game) throw notFound("Jogo");
  return c.json({
    ...toApi<Record<string, unknown>>(game),
    events: allToApi(events!.results as Record<string, unknown>[]),
  });
});

publicRoutes.get("/standings/:competition", async (c) => {
  const seasonId = await resolveSeasonId(c.env.DB, c.req.query("season"));
  const { results } = await gamesQuery(c.env.DB, {
    seasonId,
    competition: c.req.param("competition"),
  }).all();
  return c.json(computeStandings(allToApi<StandingsGame>(results)));
});

publicRoutes.get("/clubs/:slug/players", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.id, p.name, p.nickname, p.position, p.photo_url
       FROM players p JOIN clubs cl ON cl.id = p.club_id
      WHERE cl.slug = ? AND p.visible = 1
      ORDER BY CASE p.position WHEN 'goalkeeper' THEN 0 WHEN 'defender' THEN 1
               WHEN 'midfielder' THEN 2 WHEN 'forward' THEN 3 ELSE 4 END, p.name`,
  )
    .bind(c.req.param("slug"))
    .all();
  return c.json(allToApi(results));
});

const ARTICLE_LIST_COLUMNS =
  "a.id, a.slug, a.kind, a.title, a.summary, a.cover_url, a.published_at";

publicRoutes.get("/articles", async (c) => {
  const kind = c.req.query("kind");
  if (kind && kind !== "news" && kind !== "announcement")
    throw new HttpError(400, "Tipo inválido.");
  const limit = Math.min(Math.max(Number(c.req.query("limit")) || 12, 1), 50);
  // Keyset pagination: pass the last item's publishedAt as `before`.
  const before = c.req.query("before") ?? new Date().toISOString();
  const now = new Date().toISOString();
  const { results } = await c.env.DB.prepare(
    `SELECT ${ARTICLE_LIST_COLUMNS}
       FROM articles a
      WHERE a.status = 'published' AND a.published_at <= ? AND a.published_at < ?
        AND (? IS NULL OR a.kind = ?)
      ORDER BY a.published_at DESC LIMIT ?`,
  )
    .bind(now, before, kind ?? null, kind ?? null, limit)
    .all();
  return c.json(allToApi(results));
});

publicRoutes.get("/articles/:slug", async (c) => {
  const article = await c.env.DB.prepare(
    `SELECT ${ARTICLE_LIST_COLUMNS}, a.body, a.updated_at, u.name AS author_name
       FROM articles a LEFT JOIN users u ON u.id = a.author_id
      WHERE a.slug = ? AND a.status = 'published' AND a.published_at <= ?`,
  )
    .bind(c.req.param("slug"), new Date().toISOString())
    .first();
  if (!article) throw notFound("Artigo");
  return c.json(toApi(article));
});

publicRoutes.get("/documents", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, title, category, url, published_on FROM documents
      WHERE visible = 1 ORDER BY category, published_on IS NULL, published_on DESC, id DESC`,
  ).all();
  return c.json(allToApi(results));
});

publicRoutes.get("/transfers", async (c) => {
  const limit = Math.min(Math.max(Number(c.req.query("limit")) || 50, 1), 200);
  const { results } = await c.env.DB.prepare(
    `SELECT t.id, t.date, t.notes, p.id AS player_id, p.name AS player_name, p.nickname AS player_nickname,
            p.position AS player_position, fc.slug AS from_club, tc.slug AS to_club
       FROM transfers t
       JOIN players p ON p.id = t.player_id
       LEFT JOIN clubs fc ON fc.id = t.from_club_id
       LEFT JOIN clubs tc ON tc.id = t.to_club_id
      WHERE t.visible = 1
      ORDER BY t.date DESC, t.id DESC LIMIT ?`,
  )
    .bind(limit)
    .all();
  return c.json(allToApi(results));
});

const MEDIA_KEY = /^uploads\/\d{4}\/[0-9a-f-]{36}\.(png|jpg|webp)$/;

publicRoutes.get("/media/*", async (c) => {
  const key = c.req.path.replace(/^\/api\/media\//, "");
  if (!MEDIA_KEY.test(key)) throw notFound("Ficheiro");
  const object = await c.env.MEDIA.get(key);
  if (!object) throw notFound("Ficheiro");
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  // Keys are random and never reused, so the content behind a URL never changes.
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(object.body, { headers });
});
