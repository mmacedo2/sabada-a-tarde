import { Hono } from "hono";

import type { AppEnv } from "../../env";
import { audit } from "../../lib/audit";
import { allToApi, deleteRow, insertRow, nowIso, toApi, updateRow } from "../../lib/db";
import { notFound, parseId } from "../../lib/http";
import { body } from "../../lib/validate";
import { articleCreateSchema, articleUpdateSchema } from "../../schemas";

export const articleRoutes = new Hono<AppEnv>();

export function slugify(title: string): string {
  return (
    title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70)
      .replace(/-+$/, "") || "artigo"
  );
}

/** `base`, or `base-2`, `base-3`… whichever is free. */
async function uniqueSlug(db: D1Database, base: string, exceptId?: number): Promise<string> {
  const { results } = await db
    .prepare("SELECT slug FROM articles WHERE (slug = ? OR slug LIKE ?) AND id IS NOT ?")
    .bind(base, `${base}-%`, exceptId ?? null)
    .all<{ slug: string }>();
  const taken = new Set(results.map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

const byId = (db: D1Database, id: number) =>
  db
    .prepare(
      "SELECT a.*, u.name AS author_name FROM articles a LEFT JOIN users u ON u.id = a.author_id WHERE a.id = ?",
    )
    .bind(id)
    .first();

articleRoutes.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.slug, a.kind, a.title, a.status, a.published_at, a.updated_at, u.name AS author_name
       FROM articles a LEFT JOIN users u ON u.id = a.author_id
      ORDER BY a.status = 'published', COALESCE(a.published_at, a.updated_at) DESC LIMIT 500`,
  ).all();
  return c.json(allToApi(results));
});

articleRoutes.get("/:id", async (c) => {
  const article = await byId(c.env.DB, parseId(c.req.param("id")));
  if (!article) throw notFound("Artigo");
  return c.json(toApi(article));
});

articleRoutes.post("/", async (c) => {
  const input = await body(c, articleCreateSchema);
  const db = c.env.DB;
  const id = await insertRow(db, "articles", {
    ...input,
    slug: await uniqueSlug(db, input.slug ?? slugify(input.title)),
    publishedAt:
      input.status === "published" ? (input.publishedAt ?? nowIso()) : (input.publishedAt ?? null),
    authorId: c.get("user")!.id,
  });
  await audit(c, "create", "article", id, { title: input.title, status: input.status });
  return c.json(toApi((await byId(db, id))!), 201);
});

articleRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const input = await body(c, articleUpdateSchema);
  const db = c.env.DB;
  const current = await db
    .prepare("SELECT published_at FROM articles WHERE id = ?")
    .bind(id)
    .first<{ published_at: string | null }>();
  if (!current) throw notFound("Artigo");
  const publishedAt =
    input.status === "published" && !input.publishedAt && !current.published_at
      ? nowIso()
      : input.publishedAt;
  await updateRow(db, "articles", id, {
    ...input,
    ...(input.slug ? { slug: await uniqueSlug(db, input.slug, id) } : {}),
    publishedAt,
  });
  await audit(c, "update", "article", id, { fields: Object.keys(input) });
  return c.json(toApi((await byId(db, id))!));
});

articleRoutes.delete("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (!(await deleteRow(c.env.DB, "articles", id))) throw notFound("Artigo");
  await audit(c, "delete", "article", id);
  return c.body(null, 204);
});
