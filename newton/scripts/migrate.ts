import { readFile, readdir } from "node:fs/promises";
import { query, transaction } from "../src/lib/db";
async function main() {
  await query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const files = (await readdir("migrations"))
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort();
  for (const file of files) {
    const version = file.split("_")[0];
    if (
      (
        await query("SELECT version FROM schema_migrations WHERE version=$1", [
          version,
        ])
      ).length
    )
      continue;
    const sql = await readFile("migrations/" + file, "utf8");
    await transaction(async (db) => {
      for (const statement of sql.split(";").filter((x) => x.trim()))
        await db.query(statement);
      await db.query("INSERT INTO schema_migrations(version) VALUES ($1)", [
        version,
      ]);
    });
  }
  console.log("Database migration complete.");
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
