import { randomUUID } from "node:crypto";
import { query, transaction } from "../src/lib/db";
import {
  cloudSettings,
  serviceOrder,
  planOrder,
  sectionCopy,
  pageCopy,
} from "../src/lib/positioning";
async function main() {
  if (
    (
      await query("SELECT version FROM schema_migrations WHERE version=$1", [
        "002-cloud-positioning",
      ])
    ).length
  ) {
    console.log("Cloud positioning already applied.");
    return;
  }
  await transaction(async (db) => {
    await db.query(
      "UPDATE site_settings SET data=data || $1::jsonb,updated_at=now() WHERE id='main'",
      [JSON.stringify(cloudSettings)],
    );
    for (const [slug, copy] of Object.entries(sectionCopy))
      await db.query(
        "UPDATE homepage_sections SET title=$1,description=$2 WHERE slug=$3",
        [copy.title, copy.description, slug],
      );
    for (const [slug, copy] of Object.entries(pageCopy))
      await db.query(
        "UPDATE page_content SET title=$1,description=$2,body=COALESCE($3,body),updated_at=now() WHERE slug=$4",
        [copy.title, copy.description, copy.body ?? null, slug],
      );
    for (const [position, slug] of serviceOrder.entries())
      await db.query("UPDATE services SET position=$1 WHERE slug=$2", [
        position,
        slug,
      ]);
    for (const [position, name] of planOrder.entries())
      await db.query("UPDATE pricing_plans SET position=$1 WHERE name=$2", [
        position,
        name,
      ]);
    await db.query(
      "INSERT INTO audit_logs(id,action,entity) VALUES($1,$2,$3)",
      [
        randomUUID(),
        "Updated cloud, security, and DevOps positioning",
        "website_content",
      ],
    );
    await db.query("INSERT INTO schema_migrations(version) VALUES($1)", [
      "002-cloud-positioning",
    ]);
  });
  console.log(
    "Cloud-first positioning applied. Contact settings, credentials, leads, and commercial prices preserved.",
  );
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
