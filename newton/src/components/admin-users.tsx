"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function AdminUsers({
  users,
  csrf,
  current,
}: {
  users: { id: string; username: string; role: string; active: boolean }[];
  csrf: string;
  current: string;
}) {
  const router = useRouter();
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function send(data: unknown) {
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify(data),
    });
    const b = await r.json();
    if (!r.ok) throw new Error(b.error);
  }
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = e.currentTarget;
    try {
      await send({ ...Object.fromEntries(new FormData(f)), action: "create" });
      f.reset();
      setMessage(
        "Administrator created. A password change is required on first sign-in.",
      );
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function toggle(id: string, active: boolean) {
    setBusy(true);
    setError("");
    try {
      await send({ action: "toggle", id, active });
      setMessage(
        active ? "Account enabled." : "Account disabled and sessions revoked.",
      );
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {error && (
        <p className="form-message error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
      <div className="dashboard-columns">
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>Team access</h2>
          </div>
          {users.map((u) => (
            <div className="user-row" key={u.id}>
              <div>
                <strong>
                  {u.username}
                  {u.id === current ? " (you)" : ""}
                </strong>
                <small>
                  {u.role} · {u.active ? "Active" : "Disabled"}
                </small>
              </div>
              {u.id !== current && (
                <button
                  className="button button-outline"
                  disabled={busy}
                  onClick={() => toggle(u.id, !u.active)}
                >
                  {u.active ? "Disable account" : "Enable account"}
                </button>
              )}
            </div>
          ))}
        </section>
        <form className="admin-panel security-panel" onSubmit={create}>
          <h2>Add administrator</h2>
          <p>
            Editors manage content. Owners also manage leads, company settings,
            and administrator access.
          </p>
          <label>
            Username
            <input
              name="username"
              required
              minLength={3}
              maxLength={50}
              autoComplete="off"
            />
          </label>
          <label>
            Initial unique password
            <input
              name="password"
              type="password"
              required
              minLength={16}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
          <label>
            Role
            <select name="role">
              <option value="editor">Editor</option>
              <option value="owner">Owner</option>
            </select>
          </label>
          <button className="button" disabled={busy}>
            Create administrator
          </button>
        </form>
      </div>
    </>
  );
}
