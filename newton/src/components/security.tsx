"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function Security({
  csrf,
  sessions,
  current,
  mustChange,
}: {
  csrf: string;
  sessions: {
    id: string;
    user_agent: string;
    created_at: string;
    expires_at: string;
  }[];
  current: string;
  mustChange: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function action(name: string, data: unknown) {
    const r = await fetch("/api/auth/" + name, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify(data),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
  }
  async function change(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = e.currentTarget;
    const data = Object.fromEntries(new FormData(f));
    try {
      if (data.newPassword !== data.confirmPassword)
        throw new Error("New passwords do not match.");
      await action("password", data);
      f.reset();
      setMessage("Password changed. All previous sessions were revoked.");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function revoke(id: string) {
    setBusy(true);
    setError("");
    try {
      await action("revoke", { id });
      if (id === current) router.push("/adm-login");
      else {
        setMessage("Session revoked.");
        router.refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {mustChange && (
        <p className="form-message error" role="alert">
          Change your initial password to unlock the dashboard. Use a unique
          passphrase of at least 16 characters.
        </p>
      )}
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="form-message error" role="alert">
          {error}
        </p>
      )}
      <div className="dashboard-columns">
        <form onSubmit={change} className="admin-panel security-panel">
          <h2>Change password</h2>
          <p>Changing your password revokes all prior sessions.</p>
          <label>
            Current password
            <input
              type="password"
              name="currentPassword"
              required
              autoComplete="current-password"
              maxLength={128}
            />
          </label>
          <label>
            New password
            <input
              type="password"
              name="newPassword"
              required
              minLength={16}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={16}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
          <button className="button" disabled={busy}>
            Update password
          </button>
        </form>
        <section className="admin-panel security-panel">
          <h2>Your active sessions</h2>
          <p>Sessions expire eight hours after sign-in.</p>
          {sessions.map((s) => (
            <div className="session-row" key={s.id}>
              <div>
                <strong>
                  {s.id === current ? "Current session" : "Browser session"}
                </strong>
                <p>{s.user_agent}</p>
                <small>Expires {new Date(s.expires_at).toLocaleString()}</small>
              </div>
              <button
                className="button button-outline"
                onClick={() => revoke(s.id)}
                disabled={busy}
              >
                Revoke
              </button>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
