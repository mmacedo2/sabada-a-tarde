import { Hono } from "hono";

import type { AppEnv } from "./env";
import { constraintError, HttpError } from "./lib/http";
import { loadSession, requireStaff, sameOriginWrites } from "./lib/middleware";
import { articleRoutes } from "./routes/admin/articles";
import { auditRoutes } from "./routes/admin/audit";
import { crudRoutes } from "./routes/admin/crud";
import { gameRoutes } from "./routes/admin/games";
import { seasonRoutes } from "./routes/admin/seasons";
import { transferRoutes } from "./routes/admin/transfers";
import { uploadRoutes } from "./routes/admin/uploads";
import { userRoutes } from "./routes/admin/users";
import { authRoutes } from "./routes/auth";
import { publicRoutes } from "./routes/public";
import { clubSchema, competitionSchema, documentSchema, playerSchema } from "./schemas";

const admin = new Hono<AppEnv>()
  .use(requireStaff)
  .use(async (c, next) => {
    await next();
    c.header("Cache-Control", "no-store");
  })
  .route("/users", userRoutes)
  .route("/seasons", seasonRoutes)
  .route("/games", gameRoutes)
  .route("/articles", articleRoutes)
  .route("/transfers", transferRoutes)
  .route("/uploads", uploadRoutes)
  .route("/audit", auditRoutes)
  .route(
    "/clubs",
    crudRoutes({
      table: "clubs",
      entity: "club",
      label: "Clube",
      orderBy: "name",
      create: clubSchema,
      update: clubSchema.partial(),
    }),
  )
  .route(
    "/competitions",
    crudRoutes({
      table: "competitions",
      entity: "competition",
      label: "Competição",
      orderBy: "position, name",
      create: competitionSchema,
      update: competitionSchema.partial(),
    }),
  )
  .route(
    "/players",
    crudRoutes({
      table: "players",
      entity: "player",
      label: "Jogador",
      orderBy: "name",
      create: playerSchema,
      update: playerSchema.partial(),
    }),
  )
  .route(
    "/documents",
    crudRoutes({
      table: "documents",
      entity: "document",
      label: "Documento",
      orderBy: "category, published_on DESC, id DESC",
      create: documentSchema,
      update: documentSchema.partial(),
    }),
  );

const app = new Hono<AppEnv>()
  .basePath("/api")
  .use(sameOriginWrites)
  .use(loadSession)
  .get("/health", (c) => c.json({ ok: true }))
  .route("/auth", authRoutes)
  .route("/admin", admin)
  .route("/", publicRoutes);

app.notFound((c) => c.json({ error: "Endereço não encontrado." }, 404));

app.onError((error, c) => {
  if (error instanceof HttpError) return c.json({ error: error.message }, error.status);
  const mapped = constraintError(error);
  if (mapped) return c.json({ error: mapped.message }, mapped.status);
  console.error("unhandled API error", { method: c.req.method, path: c.req.path, error });
  return c.json({ error: "Erro interno. Tente novamente." }, 500);
});

export default app;
