"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Layers,
  Briefcase,
  Tags,
  Inbox,
  Image as ImageIcon,
  Settings,
  Shield,
  Users,
  Globe,
  MessageCircle,
  Search,
  LogOut,
  Menu,
  X,
} from "lucide-react";
const links = [
  ["dashboard", "Overview", LayoutDashboard],
  ["content", "Website content", FileText],
  ["sections", "Homepage sections", Layers],
  ["services", "Services", Briefcase],
  ["pricing", "Pricing plans", Tags],
  ["faqs", "FAQs", MessageCircle],
  ["leads", "Inquiries", Inbox],
  ["media", "Media library", ImageIcon],
  ["settings", "Company settings", Settings],
  ["seo", "SEO management", Search],
  ["security", "Security & sessions", Shield],
  ["users", "Administrators", Users],
] as const;
export function AdminShell({
  children,
  username,
  role,
  csrf,
}: {
  children: React.ReactNode;
  username: string;
  role: string;
  csrf: string;
}) {
  const path = usePathname(),
    router = useRouter();
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  async function logout() {
    try {
      const r = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "x-csrf-token": csrf },
      });
      if (!r.ok) throw new Error("Unable to sign out. Please try again.");
      router.push("/adm-login");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <Link href="/admin/dashboard" className="brand">
          <span className="brand-symbol">n</span>
          <span>
            newTon<small>CONTROL CENTER</small>
          </span>
        </Link>
        <button
          className="admin-close"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <span className="sidebar-label">WORKSPACE</span>
        <nav aria-label="Administration">
          {links
            .filter(
              ([key]) =>
                role === "owner" ||
                !["leads", "settings", "users"].includes(key),
            )
            .map(([key, label, I]) => (
              <Link
                onClick={() => setOpen(false)}
                className={path === "/admin/" + key ? "selected" : ""}
                key={key}
                href={"/admin/" + key}
              >
                <I size={18} />
                {label}
              </Link>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" target="_blank">
            <Globe size={17} />
            View website
          </Link>
          <button onClick={logout}>
            <LogOut size={17} />
            Sign out
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      </aside>
      {open && (
        <button
          aria-label="Close navigation"
          className="admin-scrim"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <button
              className="admin-menu-toggle"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <span>Website management</span>
          </div>
          <div className="admin-user">
            <span className="avatar">{username.slice(0, 1).toUpperCase()}</span>
            <span>
              {username}
              <small>{role}</small>
            </span>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
