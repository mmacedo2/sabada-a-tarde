import { z } from "zod";

const isValidDate = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (AAAA-MM-DD).")
  .refine(isValidDate, "Data inválida.");

const kickoffTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM).");

export const slug = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífenes.");

/** Optional free text: blank becomes null so it clears the column. */
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const requiredText = (max: number) => z.string().trim().min(1, "Campo obrigatório.").max(max);

/** Links rendered in href/src: only http(s) or site-relative paths, never javascript: and friends. */
const link = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v === "" || /^https?:\/\//i.test(v) || (v.startsWith("/") && !v.startsWith("//")),
    "Use um endereço http(s) ou um caminho começado por /.",
  )
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const id = z.number().int().positive();
const goals = z.number().int().min(0).max(99).nullable().optional();

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

const password = z
  .string()
  .min(10, "A palavra-passe precisa de pelo menos 10 caracteres.")
  .max(200);

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: password,
});

const role = z.enum(["user", "manager", "admin"]);

export const userCreateSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: requiredText(120),
  password,
  role: role.default("user"),
});

/** Self-registration: always the `user` role, whatever else the body says. */
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: requiredText(120),
  password,
});

export const userUpdateSchema = z.object({
  name: requiredText(120).optional(),
  role: role.optional(),
  active: z.boolean().optional(),
  password: password.optional(),
});

export const seasonSchema = z
  .object({
    name: requiredText(20),
    startsOn: isoDate,
    endsOn: isoDate,
    isCurrent: z.boolean().default(false),
  })
  .refine((s) => s.startsOn < s.endsOn, "A época tem de terminar depois de começar.");

export const seasonUpdateSchema = z.object({
  name: requiredText(20).optional(),
  startsOn: isoDate.optional(),
  endsOn: isoDate.optional(),
  isCurrent: z.boolean().optional(),
});

export const clubSchema = z.object({
  slug,
  name: requiredText(120),
  shortName: requiredText(60),
  initials: text(10),
  locality: text(120),
  crestUrl: link,
  color: text(60),
  colorLabel: text(120),
  foundedOn: isoDate.nullable().optional(),
  website: link,
  visible: z.boolean().default(true),
});

export const competitionSchema = z.object({
  slug,
  name: requiredText(120),
  kind: z.enum(["league", "cup", "award"]),
  tagline: text(160),
  description: text(2000),
  logoUrl: link,
  sourceUrl: link,
  position: z.number().int().min(0).max(1000).default(0),
  visible: z.boolean().default(true),
});

export const gameStatuses = [
  "scheduled",
  "live",
  "halftime",
  "finished",
  "postponed",
  "cancelled",
] as const;
export const startedStatuses: readonly string[] = ["live", "halftime", "finished"];

const gameFields = {
  seasonId: id.optional(),
  competitionId: id,
  round: requiredText(80),
  stage: text(80),
  homeClubId: id.nullable().optional(),
  awayClubId: id.nullable().optional(),
  homePlaceholder: text(80),
  awayPlaceholder: text(80),
  date: isoDate,
  kickoffTime: kickoffTime.nullable().optional(),
  venue: text(160),
  status: z.enum(gameStatuses).default("scheduled"),
  homeGoals: goals,
  awayGoals: goals,
  homePenalties: goals,
  awayPenalties: goals,
  notes: text(1000),
  visible: z.boolean().default(true),
};

export const gameCreateSchema = z
  .object(gameFields)
  .refine((g) => g.homeClubId || g.homePlaceholder, "Indique a equipa da casa.")
  .refine((g) => g.awayClubId || g.awayPlaceholder, "Indique a equipa visitante.")
  .refine(
    (g) => !g.homeClubId || g.homeClubId !== g.awayClubId,
    "Uma equipa não pode jogar contra si própria.",
  );

export const gameUpdateSchema = z.object(gameFields).partial();

export const gameEventSchema = z.object({
  type: z.enum(["goal", "penalty_goal", "own_goal", "yellow_card", "red_card"]),
  clubId: id,
  playerId: id.nullable().optional(),
  playerName: text(120),
  minute: z.number().int().min(0).max(150).nullable().optional(),
});

export const playerSchema = z.object({
  name: requiredText(120),
  nickname: text(60),
  position: z.enum(["goalkeeper", "defender", "midfielder", "forward"]).nullable().optional(),
  clubId: id.nullable().optional(),
  photoUrl: link,
  birthDate: isoDate.nullable().optional(),
  visible: z.boolean().default(true),
});

export const transferSchema = z
  .object({
    playerId: id,
    fromClubId: id.nullable().optional(),
    toClubId: id.nullable().optional(),
    date: isoDate,
    notes: text(500),
    visible: z.boolean().default(true),
  })
  .refine((t) => t.fromClubId || t.toClubId, "Indique pelo menos um clube.")
  .refine((t) => !t.fromClubId || t.fromClubId !== t.toClubId, "Os clubes têm de ser diferentes.");

const articleFields = {
  slug: slug.optional(),
  kind: z.enum(["news", "announcement"]).default("news"),
  title: requiredText(200),
  summary: text(500),
  body: z.string().trim().min(1, "O texto é obrigatório.").max(50_000),
  coverUrl: link,
  status: z.enum(["draft", "published"]).default("draft"),
  // Stored as UTC so string comparison in SQL orders and schedules correctly.
  publishedAt: z
    .string()
    .datetime({ offset: true })
    .transform((v) => new Date(v).toISOString())
    .nullable()
    .optional(),
};

export const articleCreateSchema = z.object(articleFields);
export const articleUpdateSchema = z.object(articleFields).partial();

export const documentSchema = z.object({
  title: requiredText(200),
  category: requiredText(60),
  url: link.refine((v) => v != null, "O endereço é obrigatório."),
  publishedOn: isoDate.nullable().optional(),
  visible: z.boolean().default(true),
});
