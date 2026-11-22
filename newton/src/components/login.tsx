"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
export function Login() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.push(d.redirect);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="login-card">
      <span className="login-icon">
        <LockKeyhole />
      </span>
      <span className="eyebrow">NEwTON CONTROL CENTER</span>
      <h1>Welcome back.</h1>
      <p>Sign in to manage your website.</p>
      <label>
        Username
        <input
          name="username"
          autoComplete="username"
          required
          maxLength={100}
        />
      </label>
      <label>
        Password
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      {error && (
        <p className="form-message error" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy ? "Signing in…" : "Sign in securely"}
      </button>
      <small>
        Authorized administrators only. Contact your site owner if you need
        access.
      </small>
    </form>
  );
}
