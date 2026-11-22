import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { modules } from "@/lib/modules";
import { query } from "@/lib/db";
import { AdminEditor } from "@/components/admin-editor";
import { getSettings } from "@/lib/content";
export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: route } = await params;
  const key = route === "seo" ? "content" : route,
    m = modules[key];
  if (!m) notFound();
  const u = await requireAdmin();
  if (["settings", "leads"].includes(key) && u.role !== "owner")
    return (
      <div className="admin-panel">
        <h1>Owner access required</h1>
        <p>Your editor account cannot access this module.</p>
      </div>
    );
  const rows = m.singleton
    ? [await getSettings()]
    : await query(
        `SELECT * FROM ${m.table} ${["services", "pricing", "sections", "faqs"].includes(key) ? "ORDER BY position" : key === "leads" || key === "media" ? "ORDER BY created_at DESC" : ""}`,
      );
  const settings = await getSettings();
  const serviceOptions =
    key === "pricing"
      ? await query<{ id: string; title: string }>(
          "SELECT id,title FROM services ORDER BY title",
        )
      : [];
  return (
    <AdminEditor
      defaultCurrency={settings.defaultCurrency}
      serviceOptions={serviceOptions}
      module={key}
      rows={JSON.parse(JSON.stringify(rows))}
      csrf={u.csrf_token}
      seoOnly={route === "seo"}
    />
  );
}
