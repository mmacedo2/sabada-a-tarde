import type { Context } from "hono";

import type { AppEnv } from "../env";

/**
 * Records an admin change. Best effort: the change itself already committed, so a
 * failure here is logged rather than turned into an error for the client.
 */
export async function audit(
  c: Context<AppEnv>,
  action: "create" | "update" | "delete",
  entity: string,
  entityId: number | null,
  details?: unknown,
): Promise<void> {
  try {
    await c.env.DB.prepare(
      "INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(
        c.get("user")?.id ?? null,
        action,
        entity,
        entityId,
        details === undefined ? null : JSON.stringify(details),
      )
      .run();
  } catch (error) {
    console.error("audit log write failed", { action, entity, entityId, error });
  }
}
