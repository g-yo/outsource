import { getSettings } from "@/lib/content";
import Link from "next/link";
import {
  Check,
  Cloud,
  Code2,
  ShieldCheck,
  Server,
  Layers,
  Activity,
  LockKeyhole,
  Globe2,
} from "lucide-react";
import type { Plan, Service, Settings } from "@/lib/types";
import { Icon } from "./ui";
export function Infrastructure() {
  return (
    <div
      className="infra-visual"
      role="img"
      aria-label="Connected application, cloud infrastructure, and cybersecurity architecture"
    >
      <div className="visual-grid" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <svg viewBox="0 0 600 550" className="connections" aria-hidden>
        <path d="M300 110 L300 260 M140 280 L300 260 L460 280 M300 260 L300 450 M140 280 L140 410 L300 450 L460 410 L460 280" />
        <path
          className="signal"
          d="M300 110 L300 260 L460 280 L460 410 L300 450 L140 410 L140 280 L300 260"
        />
      </svg>
      <div className="infra-node node-top">
        <Code2 />
        <span>DEVOPS</span>
        <small>Automate your operations</small>
      </div>
      <div className="infra-core">
        <div className="core-top">
          <Cloud size={50} />
        </div>
        <div className="core-base">
          <span />
          <span />
          <span />
        </div>
        <div className="core-base">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="infra-node node-left">
        <Server />
        <span>INFRASTRUCTURE</span>
      </div>
      <div className="infra-node node-right">
        <ShieldCheck />
        <span>SECURITY</span>
      </div>
      <div className="infra-label">
        <span className="label-icon">
          <Layers size={18} />
        </span>
        <div>
          Connected by design<small>Cloud · Security · DevOps</small>
        </div>
      </div>
      <div className="visual-caption">ONE CONNECTED TECHNOLOGY ECOSYSTEM</div>
    </div>
  );
}
export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link className="service-card" href={"/services/" + service.slug}>
      <span className="icon-box">
        <Icon name={service.icon} />
      </span>
      <span className="card-category">{service.division}</span>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      <span className="text-link">
        Explore service <span>+</span>
      </span>
    </Link>
  );
}
export function PricingCards({ plans }: { plans: Plan[] }) {
  return (
    <div className="pricing-grid">
      {plans.map((p) => (
        <article
          className={`price-card ${p.popular ? "featured" : ""}`}
          key={p.id}
        >
          {p.popular && <span className="popular">ONGOING PARTNERSHIP</span>}
          <span className="eyebrow">
            {p.interval === "month"
              ? "MANAGED SERVICES"
              : p.interval === "assessment"
                ? "SECURITY REVIEW"
                : "TAILORED ENGAGEMENT"}
          </span>
          <h3>{p.name}</h3>
          <p>{p.description}</p>
          <div className="price">
            {p.amount === null
              ? "Let’s scope it."
              : new Intl.NumberFormat("en", {
                  style: "currency",
                  currency: p.currency,
                }).format(Number(p.amount))}
            <small>
              {p.amount === null
                ? "Contact for quote"
                : `per ${p.interval} · ${p.currency}`}
            </small>
          </div>
          <ul className="check-list">
            {p.features.map((f) => (
              <li key={f}>
                <Check size={17} />
                {f}
              </li>
            ))}
          </ul>
          {p.addons.length > 0 && (
            <details className="addons">
              <summary>Optional add-ons</summary>
              <ul>
                {p.addons.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </details>
          )}
          <Link
            className={`button ${p.popular ? "" : "button-outline"}`}
            href={"/contact?plan=" + encodeURIComponent(p.name)}
          >
            {p.cta}
          </Link>
        </article>
      ))}
    </div>
  );
}
export async function CTA() {
  const s = await getSettings();
  return (
    <section className="cta-section">
      <div className="container cta-inner">
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h2>
            Let’s make technology
            <br />
            work for your business.
          </h2>
          <p>Bring your challenges. We’ll bring a clear way forward.</p>
        </div>
        <Link href="/contact" className="button button-white">
          {s.ctaButton}
        </Link>
      </div>
    </section>
  );
}
export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Link className="brand" href="/">
            <span className="brand-symbol">n</span>
            <span>
              {settings.businessName}
              <small>{settings.tagline}</small>
            </span>
          </Link>
          <p>{settings.footer}</p>
          <span className="footer-note">
            Cloud. Security. DevOps.
            <br />
            One connected partner.
          </span>
        </div>
        <div>
          <strong>Expertise</strong>
          <Link href="/services/managed-cloud-services">
            Cloud & infrastructure
          </Link>
          <Link href="/services/cloud-migration">Cloud migration</Link>
          <Link href="/services/cybersecurity">Cybersecurity</Link>
          <Link href="/services/devops-automation">DevOps & automation</Link>
          <Link href="/services/custom-software-development">Development & support</Link>
        </div>
        <div>
          <strong>Company</strong>
          <Link href="/about">About us</Link>
          <Link href="/solutions">Solutions</Link>
          <Link href="/industries">Industries</Link>
          <Link href="/pricing">Engagement plans</Link>
        </div>
        <div>
          <strong>Start a conversation</strong>
          <Link href="/contact">Contact our team</Link>
          {settings.supportEmail && (
            <a href={"mailto:" + settings.supportEmail}>
              {settings.supportEmail}
            </a>
          )}
          {settings.phone && (
            <a href={"tel:" + settings.phone}>{settings.phone}</a>
          )}
          {settings.whatsapp && (
            <a href={"https://wa.me/" + settings.whatsapp.replace(/\D/g, "")}>
              WhatsApp
            </a>
          )}
          {settings.address && <p>{settings.address}</p>}
          {settings.socialLinks.map((url, i) => (
            <a key={url} href={url} rel="noopener noreferrer" target="_blank">
              {new URL(url).hostname.replace("www.", "")}
            </a>
          ))}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {settings.businessName}. All rights
          reserved.
        </span>
        <div>
          <Link href="/privacy-policy">Privacy policy</Link>
          <Link href="/terms-and-conditions">Terms & conditions</Link>
        </div>
      </div>
    </footer>
  );
}
export function ManagedVisual() {
  return (
    <div className="operations-visual">
      <div className="operations-head">
        <span>
          <Activity size={18} /> A considered operating model
        </span>
        <LockKeyhole size={18} />
      </div>
      {[
        [
          "Cloud infrastructure",
          "Architecture · Capacity · Cost reviews",
          Cloud,
        ],
        ["Systems & applications", "Patching · Backups · Maintenance", Server],
        ["Security & continuity", "Access · Hardening · Recovery", ShieldCheck],
      ].map(([title, sub, Icon]) => {
        const I = Icon as typeof Cloud;
        return (
          <div className="operation-row" key={title as string}>
            <I />
            <div>
              <strong>{title as string}</strong>
              <small>{sub as string}</small>
            </div>
            <Check size={16} />
          </div>
        );
      })}
      <div className="operations-foot">
        <Globe2 size={16} /> AWS · Microsoft Azure · Google Cloud
      </div>
    </div>
  );
}
