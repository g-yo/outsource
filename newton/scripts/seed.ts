import { randomUUID } from "node:crypto";
import { query } from "../src/lib/db";
import * as defaults from "../src/lib/defaults";
async function main() {
  await query(
    "INSERT INTO site_settings(id,data) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    ["main", JSON.stringify(defaults.settings)],
  );
  for (const [table, items] of Object.entries({
    services: defaults.services,
    pricing_plans: defaults.plans,
    page_content: defaults.pages,
    homepage_sections: defaults.sections,
    faqs: defaults.faqs,
  })) {
    if ((await query(`SELECT id FROM ${table} LIMIT 1`)).length) continue;
    for (const item of items) {
      const data = { ...item, id: randomUUID() };
      const keys = Object.keys(data);
      await query(
        `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")})`,
        Object.values(data).map((v) =>
          Array.isArray(v) ? JSON.stringify(v) : v,
        ),
      );
    }
  }
  console.log(
    "Editable starter content seeded. No credentials or fabricated commercial claims created.",
  );
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
