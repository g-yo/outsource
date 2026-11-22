import { CMSImage } from "@/components/cms-image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Check,
  Layers,
  MessagesSquare,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react";
import {
  getSettings,
  getServices,
  getPlans,
  getSections,
  getFAQs,
  getPage,
} from "@/lib/content";
import {
  Infrastructure,
  ServiceCard,
  PricingCards,
  CTA,
  ManagedVisual,
} from "@/components/public";
import { FAQList } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage("home"), "/");
}
export default async function Home() {
  const [s, services, plans, sections, faqs] = await Promise.all([
    getSettings(),
    getServices(),
    getPlans(),
    getSections(),
    getFAQs(),
  ]);
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" /> {s.heroEyebrow}
            </span>
            <h1>
              {s.heroTitle.split("\n").map((line, i) => (
                <span className={i === 2 ? "accent-text" : ""} key={i}>
                  {line}
                </span>
              ))}
            </h1>
            <p>{s.heroSubtitle}</p>
            <div className="hero-actions">
              <Link href="/contact" className="button">
                {s.heroCta}
              </Link>
              <Link href="/services" className="button button-ghost">
                Explore our services
              </Link>
            </div>
            <div className="hero-note">
              <ShieldCheck size={17} /> {s.heroNote}
            </div>
          </div>
          <Infrastructure />
        </div>
        <div className="container trust-bar">
          {s.trustItems.map((t) => (
            <span key={t}>
              <Check size={17} />
              {t}
            </span>
          ))}
        </div>
      </section>
      {sections.map((section) => (
        <section
          key={section.id}
          className={`section section-${section.background} section-${section.slug}`}
        >
          <div className="container">
            {section.slug === "managed" ? (
              <div className="split">
                <div>
                  <span className="eyebrow">MANAGED IT & CLOUD SERVICES</span>
                  <h2>{section.title}</h2>
                  <p className="section-lead">{section.description}</p>
                  <ul className="check-list">
                    {s.managedFeatures.map((f) => (
                      <li key={f}>
                        <Check />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/services/managed-cloud-services"
                    className="button"
                  >
                    Explore managed services
                  </Link>
                </div>
                {section.image ? (
                  <CMSImage
                    className="section-image"
                    src={section.image}
                    alt={section.title}
                  />
                ) : (
                  <ManagedVisual />
                )}
              </div>
            ) : (
              <>
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">
                      {{
                        services: "OUR EXPERTISE",
                        why: "THE CONNECTED ADVANTAGE",
                        process: "HOW WE WORK",
                        pricing: "FLEXIBLE ENGAGEMENTS",
                        industries: "INDUSTRIES WE SERVE",
                        faq: "GOOD QUESTIONS",
                      }[section.slug] || "OUR APPROACH"}
                    </span>
                    <h2>{section.title}</h2>
                    <p>{section.description}</p>
                  </div>
                  {section.slug === "services" && (
                    <Link href="/services" className="text-link">
                      View all services <span>+</span>
                    </Link>
                  )}
                  {section.slug === "pricing" && (
                    <Link href="/pricing" className="text-link">
                      Compare engagements <span>+</span>
                    </Link>
                  )}
                </div>
                {section.image && (
                  <CMSImage
                    className="section-image banner-image"
                    src={section.image}
                    alt={section.title}
                  />
                )}{" "}
                {section.slug === "services" && (
                  <div className="services-grid">
                    {services
                      .filter((x) =>
                        [
                          "cloud-migration",
                          "devops-automation",
                          "managed-cloud-services",
                          "cybersecurity",
                        ].includes(x.slug),
                      )
                      .map((x) => (
                        <ServiceCard key={x.id} service={x} />
                      ))}
                  </div>
                )}
                {section.slug === "why" && (
                  <div className="advantages">
                    {s.whyItems
                      .map((item, i) => [
                        [Layers, ShieldCheck, MessagesSquare, HeartHandshake][
                          i % 4
                        ],
                        item.split("|")[0],
                        item.split("|")[1],
                      ])
                      .map(([I, title, desc]) => {
                        const Icon = I as typeof Layers;
                        return (
                          <div key={title as string}>
                            <Icon />
                            <h3>{title as string}</h3>
                            <p>{desc as string}</p>
                          </div>
                        );
                      })}
                  </div>
                )}
                {section.slug === "process" && (
                  <div className="process-grid">
                    {s.processSteps.map((step, i) => (
                      <div key={step}>
                        <span className="process-point">
                          <Check size={16} />
                        </span>
                        <h3>{step.split("|")[0]}</h3>
                        <p>{step.split("|")[1]}</p>
                      </div>
                    ))}
                  </div>
                )}
                {section.slug === "pricing" && (
                  <PricingCards plans={plans.slice(0, 3)} />
                )}
                {section.slug === "industries" && (
                  <div className="industry-strip">
                    {[
                      "Technology & startups",
                      "Professional services",
                      "Retail & commerce",
                      "Healthcare & wellness",
                      "Finance & business",
                      "Logistics & operations",
                    ].map((x) => (
                      <Link href="/industries" key={x}>
                        {x}
                        <span>+</span>
                      </Link>
                    ))}
                  </div>
                )}
                {section.slug === "faq" && <FAQList items={faqs} />}
              </>
            )}
          </div>
        </section>
      ))}
      <CTA />
    </>
  );
}
