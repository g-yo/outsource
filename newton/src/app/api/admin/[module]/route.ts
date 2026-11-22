import { readJSON } from "@/lib/request";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { authorize, audit, errorResponse, HttpError } from "@/lib/auth";
import { query, one } from "@/lib/db";
import { modules } from "@/lib/modules";
import { schemas, csvCell } from "@/lib/validation";
import { removeObject } from "@/lib/storage";
const schemaFor = (key: string) =>
  schemas[(key === "content" ? "pages" : key) as keyof typeof schemas];
export async function POST(
  req: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  try {
    const { module: key } = await params;
    const m = modules[key];
    if (!m) throw new HttpError(404, "Unknown module.");
    const u = await authorize(req, ["settings", "leads"].includes(key));
    const raw = await readJSON(req);
    if (JSON.stringify(raw).length > 100000)
      throw new HttpError(413, "Content is too large.");
    const action = raw.action;
    if (!["create", "update", "delete"].includes(action))
      throw new HttpError(400, "Unknown action.");
    const id = raw.id;
    if (action !== "create" && !m.singleton && !z.uuid().safeParse(id).success)
      throw new HttpError(400, "Invalid record.");
    if (m.noCreate && action !== "update" && key !== "leads")
      throw new HttpError(
        400,
        "This module only supports editing existing entries.",
      );
    if (key === "leads" && action === "create")
      throw new HttpError(400, "Use the public inquiry form.");
    if (action === "delete") {
      if (m.singleton) throw new HttpError(400, "Settings cannot be deleted.");
      if (key === "media") {
        const asset = await one<{ url: string; object_key: string | null }>(
          "SELECT url,object_key FROM media_assets WHERE id=$1",
          [id],
        );
        if (!asset) throw new HttpError(404, "Asset not found.");
        const used = await one<{ used: boolean }>(
          `SELECT EXISTS(SELECT 1 FROM services WHERE image=$1 UNION ALL SELECT 1 FROM homepage_sections WHERE image=$1 UNION ALL SELECT 1 FROM page_content WHERE og_image=$1 OR position($1 in body)>0 UNION ALL SELECT 1 FROM site_settings WHERE position($1 in data::text)>0) AS used`,
          [asset.url],
        );
        if (used?.used)
          throw new HttpError(
            409,
            "This asset is in use. Remove its content references first.",
          );
        if (asset.object_key) await removeObject(asset.object_key);
      }
      await query(`DELETE FROM ${m.table} WHERE id=$1`, [id]);
      await audit(u.user_id, "deleted", key, id);
      return Response.json({ ok: true });
    }
    const parsed = schemaFor(key)?.safeParse(raw.data);
    if (!parsed?.success)
      throw new HttpError(
        400,
        parsed?.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ") || "Invalid data.",
      );
    const data = parsed.data as Record<string, unknown>;
    if (key === "media" && action === "update") {
      const asset = await one<{ object_key: string | null; url: string }>(
        "SELECT object_key,url FROM media_assets WHERE id=$1",
        [id],
      );
      if (asset?.object_key && asset.url !== data.url)
        throw new HttpError(
          400,
          "Uploaded asset URLs cannot be changed. Upload a replacement, then update content references.",
        );
    }
    if (["content", "sections"].includes(key)) {
      const existing = await one<{ slug: string }>(
        `SELECT slug FROM ${m.table} WHERE id=$1`,
        [id],
      );
      if (existing?.slug !== data.slug)
        throw new HttpError(
          400,
          "System page and section route names cannot be changed.",
        );
    }
    const keys = Object.keys(data);
    const values = Object.values(data).map((v) =>
      typeof v === "object" && v !== null ? JSON.stringify(v) : v,
    );
    let savedId = id;
    if (m.singleton) {
      await query(
        "UPDATE site_settings SET data=$1,updated_at=now() WHERE id=$2",
        [JSON.stringify(data), "main"],
      );
      savedId = "main";
    } else if (action === "create") {
      savedId = randomUUID();
      await query(
        `INSERT INTO ${m.table}(id,${keys.join(",")}) VALUES ($1,${keys.map((_, i) => "$" + (i + 2)).join(",")})`,
        [savedId, ...values],
      );
    } else {
      const result = await query(
        `UPDATE ${m.table} SET ${keys.map((k, i) => `${k}=$${i + 1}`).join(",")} WHERE id=$${keys.length + 1} RETURNING id`,
        [...values, id],
      );
      if (!result.length) throw new HttpError(404, "Record no longer exists.");
    }
    await audit(
      u.user_id,
      action === "create" ? "created" : "updated",
      key,
      savedId,
    );
    return Response.json({ ok: true, id: savedId });
  } catch (e) {
    if ((e as { code?: string })?.code === "23505")
      return Response.json(
        { error: "This URL slug already exists. Choose a unique slug." },
        { status: 409 },
      );
    return errorResponse(e);
  }
}
export async function GET(
  req: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  try {
    const { module: key } = await params;
    await authorize(req, true);
    if (
      key !== "leads" ||
      new URL(req.url).searchParams.get("export") !== "csv"
    )
      throw new HttpError(404, "Not found.");
    const rows = await query(
      "SELECT name,company,email,phone,country,service,description,budget,status,notes,created_at FROM contact_inquiries ORDER BY created_at DESC",
    );
    const keys = [
      "name",
      "company",
      "email",
      "phone",
      "country",
      "service",
      "description",
      "budget",
      "status",
      "notes",
      "created_at",
    ];
    const csv = [
      keys.map(csvCell).join(","),
      ...rows.map((r) => keys.map((k) => csvCell(r[k])).join(",")),
    ].join("\r\n");
    return new Response("\ufeff" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="inquiries.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
