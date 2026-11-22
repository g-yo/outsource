import Link from "next/link";
import {
  Inbox,
  Tags,
  Briefcase,
  MessageCircle,
  Plus,
  FileText,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { one, query } from "@/lib/db";
export default async function Dashboard() {
  const u = await requireAdmin();
  const counts = await one<{
    inquiries: string;
    new_inquiries: string;
    plans: string;
    services: string;
  }>(
    `SELECT (SELECT count(*) FROM contact_inquiries) AS inquiries,(SELECT count(*) FROM contact_inquiries WHERE status='new') AS new_inquiries,(SELECT count(*) FROM pricing_plans WHERE visible=true) AS plans,(SELECT count(*) FROM services WHERE published=true) AS services`,
  );
  const activity = await query<{
    id: string;
    action: string;
    entity: string;
    created_at: string;
    username: string;
  }>(
    "SELECT a.id,a.action,a.entity,a.created_at,u.username FROM audit_logs a LEFT JOIN admin_users u ON a.actor_id=u.id ORDER BY a.created_at DESC LIMIT 8",
  );
  const recent =
    u.role === "owner"
      ? await query<{
          id: string;
          name: string;
          company: string;
          service: string;
          status: string;
        }>(
          "SELECT id,name,company,service,status FROM contact_inquiries ORDER BY created_at DESC LIMIT 5",
        )
      : [];
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">YOUR WEBSITE AT A GLANCE</span>
          <h1>Welcome back, {u.username}.</h1>
          <p>A clear view of your content, inquiries, and recent changes.</p>
        </div>
        <Link className="button button-outline" href="/" target="_blank">
          View live website
        </Link>
      </div>
      <div className="stats-grid">
        {[
          [Inbox, "Total inquiries", counts?.inquiries],
          [MessageCircle, "New inquiries", counts?.new_inquiries],
          [Tags, "Active plans", counts?.plans],
          [Briefcase, "Published services", counts?.services],
        ]
          .filter((_, i) => u.role === "owner" || i > 1)
          .map(([C, label, value]) => {
            const I = C as typeof Inbox;
            return (
              <div className="stat-card" key={label as string}>
                <div>
                  <span>{label as string}</span>
                  <I size={20} />
                </div>
                <strong>{(value as string) || "0"}</strong>
                <small>Current database records</small>
              </div>
            );
          })}
      </div>
      <div className="dashboard-columns">
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>
              {u.role === "owner" ? "Recent inquiries" : "Content shortcuts"}
            </h2>
            {u.role === "owner" && <Link href="/admin/leads">View all</Link>}
          </div>
          {recent.length ? (
            <div className="recent-list">
              {recent.map((r) => (
                <Link href="/admin/leads" key={r.id}>
                  <span className="avatar">{r.name[0]}</span>
                  <div>
                    <strong>{r.name}</strong>
                    <small>
                      {r.company} · {r.service}
                    </small>
                  </div>
                  <span className="status-badge">{r.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="table-empty">
              <Inbox />
              <h3>
                {u.role === "owner"
                  ? "Your next conversation starts here."
                  : "Keep your website current."}
              </h3>
              <p>
                {u.role === "owner"
                  ? "New contact form submissions will appear here."
                  : "Manage your services, pages, and pricing from the sidebar."}
              </p>
              <Link
                className="button button-outline"
                href={u.role === "owner" ? "/contact" : "/admin/content"}
              >
                {u.role === "owner"
                  ? "View inquiry form"
                  : "Edit website content"}
              </Link>
            </div>
          )}
        </section>
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>Recent activity</h2>
            <Link href="/admin/security">Audit log</Link>
          </div>
          <div className="activity-list">
            {activity.length ? (
              activity.map((a) => (
                <div key={a.id}>
                  <span className="activity-icon">
                    <FileText size={16} />
                  </span>
                  <div>
                    <strong>
                      {a.action} · {a.entity.replaceAll("_", " ")}
                    </strong>
                    <small>
                      {a.username || "System"} ·{" "}
                      {new Date(a.created_at).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}{" "}
                      IST
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p>No changes recorded yet.</p>
            )}
          </div>
        </section>
      </div>
      <div className="admin-callout">
        <div>
          <span className="eyebrow">KEEP YOUR WEBSITE CURRENT</span>
          <h2>Your expertise, clearly presented.</h2>
          <p>Update services and engagement plans as your business evolves.</p>
        </div>
        <Link className="button" href="/admin/services">
          <Plus size={17} />
          Manage services
        </Link>
      </div>
    </>
  );
}
