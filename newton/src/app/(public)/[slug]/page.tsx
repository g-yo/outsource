import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPage,
  getServices,
  getPlans,
  getSettings,
  getFAQs,
} from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { ServiceCard, PricingCards, CTA } from "@/components/public";
import { FAQList } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";
const allowed = [
  "about",
  "services",
  "solutions",
  "pricing",
  "industries",
  "contact",
  "privacy-policy",
  "terms-and-conditions",
];
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return pageMetadata(await getPage(slug), "/" + slug);
}
export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string; plan?: string }>;
}) {
  const { slug } = await params;
  if (!allowed.includes(slug)) notFound();
  const page = await getPage(slug);
  if (!page) notFound();
  const [services, plans, s, faqs, search] = await Promise.all([
    getServices(),
    getPlans(),
    getSettings(),
    getFAQs(),
    searchParams,
  ]);
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            {slug.replaceAll("-", " ")}
          </div>
          <span className="eyebrow">
            {s.businessName} /{" "}
            {slug === "about"
              ? "OUR PERSPECTIVE"
              : slug.replaceAll("-", " ").toUpperCase()}
          </span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {slug === "services" ? (
            <>
              {[
                "Cloud & operations",
                "Cybersecurity",
                "Software engineering",
              ].map((d) => (
                <div className="service-group" key={d}>
                  <h2>
                    {d === "Software engineering"
                      ? "Development & application support"
                      : d}
                  </h2>
                  <div className="services-grid">
                    {services
                      .filter((x) => x.division === d)
                      .map((x) => (
                        <ServiceCard key={x.id} service={x} />
                      ))}
                  </div>
                </div>
              ))}
            </>
          ) : slug === "pricing" ? (
            <>
              <PricingCards plans={plans} />
              <p className="pricing-disclaimer">
                All engagements are scoped individually. Actual pricing depends
                on complexity, agreed support coverage, taxes, and deliverables.
                Third-party cloud, domain, and software charges may apply
                separately. Currencies reflect configured prices; no automatic
                currency conversion is applied.
              </p>
              <div className="subsection">
                <h2>Clear expectations from the beginning.</h2>
                <FAQList items={faqs.slice(1, 4)} />
              </div>
            </>
          ) : slug === "contact" ? (
            <div className="contact-grid">
              <aside>
                <span className="eyebrow">START WITH A CONVERSATION</span>
                <h2>
                  A little context.
                  <br />A better starting point.
                </h2>
                <p>
                  Share your goals, your current environment, and what you need
                  help with. We’ll review your inquiry and discuss a practical
                  next step.
                </p>
                <ul className="contact-steps">
                  <li>Tell us what you’re working on</li>
                  <li>Explore the right approach together</li>
                  <li>Receive a proposal with a clear scope</li>
                </ul>
                {s.supportEmail && (
                  <a className="text-link" href={"mailto:" + s.supportEmail}>
                    {s.supportEmail}
                  </a>
                )}
                {s.whatsapp && (
                  <a
                    className="button button-outline"
                    href={"https://wa.me/" + s.whatsapp.replace(/\D/g, "")}
                  >
                    Chat on WhatsApp
                  </a>
                )}
                {s.address && <p>{s.address}</p>}
              </aside>
              <ContactForm
                services={services}
                selected={search.service || ""}
                plan={search.plan || ""}
              />
            </div>
          ) : ["solutions", "industries"].includes(slug) ? (
            <div className="solution-grid">
              {page.body
                .split("\n")
                .filter(Boolean)
                .map((row, i) => (
                  <article className="solution-card" key={i}>
                    <span className="eyebrow">
                      {slug === "solutions"
                        ? "BUSINESS SOLUTION"
                        : "INDUSTRY FOCUS"}
                    </span>
                    <h2>{row.split("|")[0]}</h2>
                    <p>{row.split("|")[1]}</p>
                    <Link
                      className="text-link"
                      href={
                        "/contact?service=" +
                        encodeURIComponent(row.split("|")[0])
                      }
                    >
                      Discuss your needs <span>+</span>
                    </Link>
                  </article>
                ))}
            </div>
          ) : (
            <div className="prose">
              {slug === "about" && <p>{s.companyDescription}</p>}
              {page.body.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {slug === "about" && (
                <>
                  <h2>Three disciplines. One shared purpose.</h2>
                  <p>
                    Software that supports your workflows. Infrastructure that
                    supports your software. Security that supports both.
                  </p>
                  <Link className="button" href="/services">
                    Meet our expertise
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </section>
      {!["contact", "privacy-policy", "terms-and-conditions"].includes(
        slug,
      ) && <CTA />}
    </>
  );
}
