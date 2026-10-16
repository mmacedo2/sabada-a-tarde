import type { ContentfulStatusCode } from "hono/utils/http-status";

/** An error whose message is safe to show to the client. */
export class HttpError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, `${what} não encontrado.`);

export function parseId(raw: string | undefined): number {
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(400, "Identificador inválido.");
  return id;
}

/** Translates SQLite constraint failures into client errors instead of 500s. */
export function constraintError(error: unknown): HttpError | null {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("UNIQUE constraint failed")) {
    return new HttpError(409, "Já existe um registo com esse valor.");
  }
  if (message.includes("FOREIGN KEY constraint failed")) {
    return new HttpError(409, "O registo está ligado a outros dados ou referencia dados que não existem.");
  }
  if (message.includes("CHECK constraint failed")) {
    return new HttpError(400, "Os dados não respeitam as regras da base de dados.");
  }
  return null;
}
