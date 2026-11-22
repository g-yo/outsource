import { readJSON } from "@/lib/request";
import { z } from "zod";
import { cookies } from "next/headers";
import { one, query } from "@/lib/db";
import {
  authorize,
  checkOrigin,
  limited,
  clientIP,
  verify,
  createSession,
  errorResponse,
  HttpError,
  audit,
  passwordHash,
  sessionCookie,
} from "@/lib/auth";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    checkOrigin(req);
    const { action } = await params;
    if (action === "login") {
      await limited("login-ip:" + (await clientIP()), 30, 900);
      const data = z
        .object({
          username: z.string().trim().min(1).max(100),
          password: z.string().min(1).max(128),
        })
        .safeParse(await readJSON(req));
      if (!data.success)
        throw new HttpError(400, "Enter your username and password.");
      await limited("login-user:" + data.data.username.toLowerCase(), 8, 900);
      const user = await one<{
        id: string;
        password_hash: string;
        must_change_password: boolean;
      }>(
        "SELECT id,password_hash,must_change_password FROM admin_users WHERE username=$1 AND active=true",
        [data.data.username],
      );
      const valid = user
        ? await verify(user.password_hash, data.data.password)
        : await verify(
            await passwordHash("dummy-password-for-timing"),
            data.data.password,
          );
      if (!user || !valid)
        throw new HttpError(401, "Incorrect username or password.");
      await createSession(user.id, req.headers.get("user-agent") || "");
      await audit(user.id, "login", "session");
      return Response.json({
        redirect: user.must_change_password
          ? "/admin/security?change=required"
          : "/admin/dashboard",
      });
    }
    const user = await authorize(req, false, true);
    if (action === "logout") {
      await query("DELETE FROM sessions WHERE id=$1", [user.id]);
      (await cookies()).delete(sessionCookie);
      return Response.json({ ok: true });
    }
    if (action === "password") {
      await limited("password:" + user.user_id, 8, 900);
      const data = z
        .object({
          currentPassword: z.string().max(128),
          newPassword: z.string().min(16).max(128),
        })
        .safeParse(await readJSON(req));
      if (!data.success)
        throw new HttpError(
          400,
          "Use a new password between 16 and 128 characters.",
        );
      const record = await one<{ password_hash: string }>(
        "SELECT password_hash FROM admin_users WHERE id=$1",
        [user.user_id],
      );
      if (
        !record ||
        !(await verify(record.password_hash, data.data.currentPassword))
      )
        throw new HttpError(400, "Current password is incorrect.");
      if (data.data.currentPassword === data.data.newPassword)
        throw new HttpError(400, "Choose a different password.");
      await query(
        "UPDATE admin_users SET password_hash=$1,must_change_password=false WHERE id=$2",
        [await passwordHash(data.data.newPassword), user.user_id],
      );
      await query("DELETE FROM sessions WHERE user_id=$1", [user.user_id]);
      await createSession(user.user_id, req.headers.get("user-agent") || "");
      await audit(
        user.user_id,
        "password changed; all prior sessions revoked",
        "admin_user",
        user.user_id,
      );
      return Response.json({ ok: true });
    }
    if (action === "revoke") {
      const { id } = z.object({ id: z.uuid() }).parse(await readJSON(req));
      await query("DELETE FROM sessions WHERE id=$1 AND user_id=$2", [
        id,
        user.user_id,
      ]);
      await audit(user.user_id, "revoked", "session", id);
      return Response.json({ ok: true });
    }
    throw new HttpError(404, "Unknown action.");
  } catch (e) {
    return errorResponse(e);
  }
}
