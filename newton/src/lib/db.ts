import "dotenv/config";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import path from "node:path";
import { mkdirSync } from "node:fs";
type Database = {
  query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
};
const globalDb = globalThis as unknown as { newtonDb?: Database };
export function database(): Database {
  if (globalDb.newtonDb) return globalDb.newtonDb;
  if (process.env.DATABASE_URL)
    globalDb.newtonDb = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    }) as Database;
  else if (
    process.env.LOCAL_DATABASE === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    const dir = path.resolve(
      /* turbopackIgnore: true */ process.env.LOCAL_DATA_DIR ||
        ".data/postgres",
    );
    mkdirSync(path.dirname(dir), { recursive: true });
    globalDb.newtonDb = new PGlite(dir) as Database;
  } else throw new Error("Database not configured. Set DATABASE_URL.");
  return globalDb.newtonDb;
}
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return (await database().query<T>(sql, params)).rows;
}
export async function one<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  return (await query<T>(sql, params))[0];
}
export async function transaction(work: (db: Database) => Promise<void>) {
  const db = database();
  if (db instanceof Pool) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await work(client as Database);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } else {
    await (db as PGlite).transaction(async (tx) => {
      await work(tx as Database);
    });
  }
}
