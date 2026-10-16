export const NOW_SQL = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

const BOOLEAN_COLUMNS = new Set(["visible", "active", "is_current"]);

const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** Row from D1 (snake_case, 0/1 flags) to API shape (camelCase, booleans). */
export function toApi<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[toCamel(key)] = BOOLEAN_COLUMNS.has(key) ? value === 1 : value;
  }
  return out as T;
}

export const allToApi = <T>(rows: Record<string, unknown>[]): T[] => rows.map((r) => toApi<T>(r));

/**
 * Validated input (camelCase) to column/value pairs. Keys come from a zod schema,
 * never from raw client input, so they are safe to interpolate as column names.
 */
function toColumns(input: Record<string, unknown>): [string, unknown][] {
  return Object.entries(input)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [toSnake(key), typeof value === "boolean" ? Number(value) : value]);
}

export async function insertRow(
  db: D1Database,
  table: string,
  input: Record<string, unknown>,
): Promise<number> {
  const columns = toColumns(input);
  const sql = `INSERT INTO ${table} (${columns.map(([c]) => c).join(", ")})
    VALUES (${columns.map(() => "?").join(", ")}) RETURNING id`;
  const row = await db
    .prepare(sql)
    .bind(...columns.map(([, v]) => v))
    .first<{ id: number }>();
  if (!row) throw new Error(`INSERT into ${table} returned no id`);
  return row.id;
}

export function updateStatement(
  db: D1Database,
  table: string,
  id: number,
  input: Record<string, unknown>,
): D1PreparedStatement {
  const columns = toColumns(input);
  const sets = [...columns.map(([c]) => `${c} = ?`), `updated_at = ${NOW_SQL}`];
  return db
    .prepare(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...columns.map(([, v]) => v), id);
}

/** Returns false when no row has this id. */
export async function updateRow(
  db: D1Database,
  table: string,
  id: number,
  input: Record<string, unknown>,
): Promise<boolean> {
  const result = await updateStatement(db, table, id, input).run();
  return result.meta.changes > 0;
}

export async function deleteRow(db: D1Database, table: string, id: number): Promise<boolean> {
  const result = await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  return result.meta.changes > 0;
}

export const nowIso = () => new Date().toISOString();
