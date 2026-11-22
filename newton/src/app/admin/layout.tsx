import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administration | newTon",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await requireAdmin(true);
  return (
    <AdminShell username={u.username} role={u.role} csrf={u.csrf_token}>
      {children}
    </AdminShell>
  );
}
