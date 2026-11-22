import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { AdminUsers } from "@/components/admin-users";
export default async function UsersPage() {
  const u = await requireAdmin();
  if (u.role !== "owner") return <h1>Owner access required</h1>;
  const users = await query<{
    id: string;
    username: string;
    role: string;
    active: boolean;
  }>("SELECT id,username,role,active FROM admin_users ORDER BY created_at");
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">CONTROLLED ACCESS</span>
          <h1>Administrators</h1>
          <p>
            Invite trusted team members through provisioned accounts. There is
            no public registration.
          </p>
        </div>
      </div>
      <AdminUsers users={users} csrf={u.csrf_token} current={u.user_id} />
    </>
  );
}
