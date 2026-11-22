import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { Security } from "@/components/security";
export default async function SecurityPage() {
  const u = await requireAdmin(true);
  const sessions = await query<{
    id: string;
    user_agent: string;
    created_at: string;
    expires_at: string;
  }>(
    "SELECT id,user_agent,created_at,expires_at FROM sessions WHERE user_id=$1 AND expires_at>now() ORDER BY created_at DESC",
    [u.user_id],
  );
  const logs = u.must_change_password
    ? []
    : await query<{
        id: string;
        action: string;
        entity: string;
        entity_id: string;
        username: string;
        created_at: string;
      }>(
        "SELECT a.id,a.action,a.entity,a.entity_id,a.created_at,u.username FROM audit_logs a LEFT JOIN admin_users u ON a.actor_id=u.id ORDER BY a.created_at DESC LIMIT 100",
      );
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">ACCOUNT PROTECTION</span>
          <h1>Security & sessions</h1>
          <p>
            Manage your password, access sessions, and review recent activity.
          </p>
        </div>
      </div>
      <Security
        csrf={u.csrf_token}
        sessions={JSON.parse(JSON.stringify(sessions))}
        current={u.id}
        mustChange={u.must_change_password}
      />
      {!u.must_change_password && (
        <section className="admin-panel audit-panel">
          <div className="panel-heading">
            <h2>Audit log</h2>
            <span>Latest 100 events</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Administrator</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{l.action}</td>
                    <td>
                      {l.entity}
                      <small>{l.entity_id}</small>
                    </td>
                    <td>{l.username || "System"}</td>
                    <td>
                      {new Date(l.created_at).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}{" "}
                      IST
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
