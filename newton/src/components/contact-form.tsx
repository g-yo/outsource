"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Service } from "@/lib/types";
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}
export function ContactForm({
  services,
  selected,
  plan,
}: {
  services: Service[];
  selected: string;
  plan: string;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [success, setSuccess] = useState(false),
    [token, setToken] = useState("");
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string>(undefined);
  useEffect(() => {
    if (success) return;
    const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!key) return;
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      if (widget.current && window.turnstile)
        widgetId.current = window.turnstile.render(widget.current, {
          sitekey: key,
          callback: (t: string) => setToken(t),
          "expired-callback": () => setToken(""),
        });
    };
    document.head.appendChild(script);
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      script.remove();
    };
  }, [success]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(fd),
          consent: fd.get("consent") === "on",
          turnstile: token,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setSuccess(true);
      setMessage(
        "Thank you. Your inquiry has been received. Our team will review the details and follow up using the email you provided.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to send. Please try again.",
      );
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
      setToken("");
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="form-card success-panel" role="status">
        <span className="eyebrow">INQUIRY RECEIVED</span>
        <h2>A good conversation starts here.</h2>
        <p>{message}</p>
        <button
          className="button button-outline"
          onClick={() => {
            setSuccess(false);
            setMessage("");
          }}
        >
          Send another inquiry
        </button>
      </div>
    );
  return (
    <form className="form-card" onSubmit={submit}>
      <h3>Tell us about your project</h3>
      <p>Fields marked * are required.</p>
      <div className="form-grid">
        <label>
          Your name *
          <input
            name="name"
            required
            minLength={2}
            maxLength={250}
            autoComplete="name"
          />
        </label>
        <label>
          Company *
          <input
            name="company"
            required
            maxLength={250}
            autoComplete="organization"
          />
        </label>
        <label>
          Work email *
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
          />
        </label>
        <label>
          Phone <span>(optional)</span>
          <input name="phone" type="tel" maxLength={40} autoComplete="tel" />
        </label>
        <label>
          Country *
          <input
            name="country"
            required
            minLength={2}
            maxLength={250}
            autoComplete="country-name"
          />
        </label>
        <label>
          Service of interest *
          <select name="service" required defaultValue={selected}>
            <option value="">Select a service</option>
            {selected && !services.some((s) => s.title === selected) && (
              <option>{selected}</option>
            )}
            {services.map((s) => (
              <option key={s.id}>{s.title}</option>
            ))}
            <option>Not sure yet — let’s discuss</option>
          </select>
        </label>
      </div>
      <label>
        Project description *
        <textarea
          name="description"
          required
          minLength={30}
          maxLength={10000}
          rows={5}
          defaultValue={plan ? `I’m interested in ${plan}. ` : ""}
          placeholder="What would you like to build, improve, or solve? Please include at least 30 characters."
        />
      </label>
      <label>
        Preferred budget <span>(optional)</span>
        <input
          name="budget"
          maxLength={250}
          placeholder="Include your preferred currency"
        />
      </label>
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="checkbox-label">
        <input name="consent" type="checkbox" required />
        <span>
          I agree to the <Link href="/privacy-policy">privacy policy</Link> and
          consent to being contacted about this inquiry. *
        </span>
      </label>
      <div ref={widget} />
      {message && (
        <p role="alert" className="form-message error">
          {message}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy ? "Sending your inquiry…" : "Send inquiry"}
      </button>
      <p className="form-note">
        Please don’t include passwords or sensitive account information.
      </p>
    </form>
  );
}
