import type { Context } from "hono";
import type { z } from "zod";

import { HttpError } from "./http";

/** Parses the JSON body; the first validation message is returned to the client. */
export async function body<S extends z.ZodTypeAny>(c: Context, schema: S): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new HttpError(400, "Corpo do pedido não é JSON válido.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join(".");
    throw new HttpError(
      400,
      field ? `${field}: ${issue?.message}` : (issue?.message ?? "Dados inválidos."),
    );
  }
  return result.data;
}
