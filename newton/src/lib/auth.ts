import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { hash, verify, argon2id } from "argon2";
import { one, query } from "./db";
import { isAllowedOrigin } from "./origin";
export const sessionCookie = "newton_session";
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export type Identity = {
  id: string;
  user_id: string;
  username: string;
  role: "owner" | "editor";
  must_change_password: boolean;
  csrf_token: string;
};
export async function identity() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return undefined;
  return one<Identity>(
    "SELECT s.id,s.user_id,s.csrf_token,u.username,u.role,u.must_change_password FROM sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true",
    [digest(token)],
  );
}
export async function requireAdmin(allowPasswordChange = false) {
  const user = await identity();
  if (!user) redirect("/adm-login");
  if (user.must_change_password && !allowPasswordChange)
    redirect("/admin/security?change=required");
  return user;
}
export async function authorize(
  req: Request,
  owner = false,
  allowPasswordChange = false,
) {
  if (req.method !== "GET") checkOrigin(req);
  const user = await identity();
  if (!user) throw new HttpError(401, "Please sign in.");
  if (user.must_change_password && !allowPasswordChange)
    throw new HttpError(403, "Change your password before continuing.");
  if (owner && user.role !== "owner")
    throw new HttpError(403, "Owner access required.");
  if (req.headers.get("x-csrf-token") !== user.csrf_token)
    throw new HttpError(403, "Refresh the page and try again.");
  return user;
}
export function checkOrigin(req: Request) {
  const origin = process.env.APP_URL || "http://localhost:3000";
  if (
    !isAllowedOrigin(
      req.headers.get("origin"),
      req.url,
      origin,
      process.env.NODE_ENV === "development",
    )
  )
    throw new HttpError(403, "Request origin is not allowed.");
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function errorResponse(e: unknown) {
  if (e instanceof HttpError)
    return Response.json({ error: e.message }, { status: e.status });
  console.error(
    "Request failed:",
    e instanceof Error ? e.message : "Unknown error",
  );
  return Response.json(
    { error: "The request could not be completed. Please try again." },
    { status: 500 },
  );
}
export async function limited(key: string, max: number, seconds: number) {
  const r = await one<{ count: number }>(
    "INSERT INTO rate_limits(key,count,reset_at) VALUES ($1,1,now()+($2 * interval '1 second')) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.count+1 END, reset_at=CASE WHEN rate_limits.reset_at<now() THEN now()+($2 * interval '1 second') ELSE rate_limits.reset_at END RETURNING count",
    [digest(key), seconds],
  );
  if ((r?.count || 0) > max)
    throw new HttpError(429, "Too many attempts. Please try again later.");
}
export async function clientIP() {
  return process.env.TRUST_PROXY === "true"
    ? (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown"
    : "shared";
}
export async function audit(
  actor: string | null,
  action: string,
  entity: string,
  id = "",
) {
  await query(
    "INSERT INTO audit_logs(id,actor_id,action,entity,entity_id) VALUES ($1,$2,$3,$4,$5)",
    [randomUUID(), actor, action, entity, id],
  );
}
export const passwordHash = (p: string) =>
  hash(p, { type: argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 });
export { verify };
export async function createSession(userId: string, agent: string) {
  const token = randomBytes(32).toString("base64url");
  await query("DELETE FROM sessions WHERE expires_at<now()");
  await query(
    "INSERT INTO sessions(id,user_id,token_hash,csrf_token,user_agent,expires_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [
      randomUUID(),
      userId,
      digest(token),
      randomBytes(32).toString("base64url"),
      agent.slice(0, 250),
      new Date(Date.now() + 8 * 3600_000),
    ],
  );
  (await cookies()).set(sessionCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 3600,
  });
}
