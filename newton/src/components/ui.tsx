"use client";
import * as Accordion from "@radix-ui/react-accordion";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Plus,
  Menu,
  X,
  ChevronDown,
  Code2,
  Cloud,
  ShieldCheck,
  Server,
  CircuitBoard,
  Workflow,
  Check,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { FAQ, Service, Settings } from "@/lib/types";
export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Component =
    (
      {
        code: Code2,
        cloud: Cloud,
        shield: ShieldCheck,
        server: Server,
        workflow: Workflow,
        check: Check,
      } as Record<string, typeof Code2>
    )[name] || CircuitBoard;
  return <Component className={className} strokeWidth={1.5} aria-hidden />;
}
export function FAQList({
  items,
}: {
  items: Pick<FAQ, "question" | "answer">[];
}) {
  return (
    <Accordion.Root type="single" collapsible className="faq-list">
      {items.map((f, i) => (
        <Accordion.Item key={i} value={String(i)} className="faq-item">
          <Accordion.Header>
            <Accordion.Trigger>
              {f.question}
              <Plus size={20} />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>
            <p>{f.answer}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
export function Header({
  settings,
  services,
}: {
  settings: Settings;
  services: Service[];
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="container nav">
        <Link
          href="/"
          className="brand"
          aria-label={`${settings.businessName} home`}
        >
          {settings.logo ? (
            <img src={settings.logo} alt="" />
          ) : (
            <span className="brand-symbol">n</span>
          )}
          <span>
            {settings.businessName}
            <small>{settings.tagline}</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Main">
          <div className="mega-wrap">
            <Link
              className={path.startsWith("/services") ? "active" : ""}
              href="/services"
            >
              Services <ChevronDown size={14} />
            </Link>
            <div className="mega-menu">
              <div>
                <span className="eyebrow">CONNECTED EXPERTISE</span>
                <h3>
                  One partner.
                  <br />
                  Every layer.
                </h3>
                <Link href="/services">Explore all services</Link>
              </div>
              {[
                "Cloud & operations",
                "Cybersecurity",
                "Software engineering",
              ].map((d) => (
                <div key={d}>
                  <strong>{d}</strong>
                  {services
                    .filter((s) => s.division === d)
                    .map((s) => (
                      <Link key={s.id} href={"/services/" + s.slug}>
                        {s.title}
                      </Link>
                    ))}
                </div>
              ))}
            </div>
          </div>
          {["solutions", "about", "pricing", "contact"].map((x) => (
            <Link
              key={x}
              className={path === "/" + x ? "active" : ""}
              href={"/" + x}
            >
              {x[0].toUpperCase() + x.slice(1)}
            </Link>
          ))}
        </nav>
        <Link className="button nav-cta" href="/contact">
          Let’s talk
        </Link>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger className="mobile-toggle" aria-label="Open menu">
            <Menu />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="mobile-menu">
              <Dialog.Title>Explore {settings.businessName}</Dialog.Title>
              <Dialog.Description className="sr-only">
                Website navigation
              </Dialog.Description>
              <Dialog.Close className="close" aria-label="Close menu">
                <X />
              </Dialog.Close>
              {[
                "services",
                "solutions",
                "about",
                "pricing",
                "industries",
                "contact",
              ].map((x) => (
                <Link key={x} onClick={() => setOpen(false)} href={"/" + x}>
                  {x[0].toUpperCase() + x.slice(1)}
                </Link>
              ))}
              <Link
                onClick={() => setOpen(false)}
                className="button"
                href="/contact"
              >
                Get a free consultation
              </Link>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
