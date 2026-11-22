import { readJSON } from "@/lib/request";
import { randomUUID } from "node:crypto";
import { inquirySchema } from "@/lib/validation";
import {
  checkOrigin,
  limited,
  clientIP,
  HttpError,
  errorResponse,
} from "@/lib/auth";
import { query } from "@/lib/db";
import { getSettings } from "@/lib/content";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    await limited("inquiry:" + (await clientIP()), 10, 3600);
    if (Number(req.headers.get("content-length") || 0) > 20000)
      throw new HttpError(413, "Your inquiry is too large.");
    const parsed = inquirySchema.safeParse(await readJSON(req));
    if (!parsed.success)
      throw new HttpError(
        400,
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      );
    const d = parsed.data;
    if (d.website) return Response.json({ ok: true });
    if (process.env.TURNSTILE_SECRET_KEY) {
      const r = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: d.turnstile || "",
          }),
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!(await r.json()).success)
        throw new HttpError(400, "Please complete the spam protection check.");
    } else if (process.env.NODE_ENV === "production")
      throw new HttpError(
        503,
        "The inquiry form is being configured. Please try again later.",
      );
    await limited("inquiry-email:" + d.email.toLowerCase(), 3, 3600);
    const id = randomUUID();
    await query(
      "INSERT INTO contact_inquiries(id,name,company,email,phone,country,service,description,budget,consent) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        id,
        d.name,
        d.company,
        d.email,
        d.phone,
        d.country,
        d.service,
        d.description,
        d.budget,
        true,
      ],
    );
    let notification = "not_configured";
    const s = await getSettings();
    if (
      s.notificationEmail &&
      process.env.RESEND_API_KEY &&
      process.env.NOTIFY_FROM
    ) {
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.NOTIFY_FROM,
            to: [s.notificationEmail],
            subject: "New website inquiry",
            text: `A new inquiry from ${d.name} at ${d.company} is ready to review.\nService: ${d.service}\nOpen your admin dashboard: ${process.env.APP_URL}/admin/leads`,
          }),
          signal: AbortSignal.timeout(8000),
        });
        notification = r.ok ? "sent" : "failed";
      } catch {
        notification = "failed";
      }
    }
    await query(
      "UPDATE contact_inquiries SET notification_status=$1 WHERE id=$2",
      [notification, id],
    );
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
