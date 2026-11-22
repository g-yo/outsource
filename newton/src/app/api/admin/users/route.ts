import { readJSON } from "@/lib/request";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  authorize,
  audit,
  passwordHash,
  HttpError,
  errorResponse,
} from "@/lib/auth";
import { query, one } from "@/lib/db";
export async function POST(req: Request) {
  try {
    const u = await authorize(req, true);
    const body = await readJSON(req);
    if (body.action === "create") {
      const d = z
        .object({
          username: z.string().regex(/^[a-zA-Z0-9_.-]{3,50}$/),
          password: z.string().min(16).max(128),
          role: z.enum(["owner", "editor"]),
        })
        .safeParse(body);
      if (!d.success)
        throw new HttpError(
          400,
          "Use a unique username (3–50 letters, digits, dots, dashes) and a password of at least 16 characters.",
        );
      const id = randomUUID();
      await query(
        "INSERT INTO admin_users(id,username,password_hash,role,must_change_password) VALUES ($1,$2,$3,$4,true)",
        [id, d.data.username, await passwordHash(d.data.password), d.data.role],
      );
      await audit(u.user_id, "created", "administrator", id);
      return Response.json({ ok: true });
    }
    if (body.action === "toggle") {
      const d = z.object({ id: z.uuid(), active: z.boolean() }).parse(body);
      if (d.id === u.user_id)
        throw new HttpError(400, "You cannot disable your own account.");
      await query("UPDATE admin_users SET active=$1 WHERE id=$2", [
        d.active,
        d.id,
      ]);
      if (!d.active)
        await query("DELETE FROM sessions WHERE user_id=$1", [d.id]);
      await audit(
        u.user_id,
        d.active ? "enabled" : "disabled",
        "administrator",
        d.id,
      );
      return Response.json({ ok: true });
    }
    throw new HttpError(400, "Unknown action.");
  } catch (e) {
    if ((e as { code?: string })?.code === "23505")
      return Response.json(
        { error: "Username already exists." },
        { status: 409 },
      );
    return errorResponse(e);
  }
}
