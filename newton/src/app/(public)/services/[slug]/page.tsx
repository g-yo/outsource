import { CMSImage } from "@/components/cms-image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { getServices } from "@/lib/content";
import { Icon, FAQList } from "@/components/ui";
import { CTA, ServiceCard } from "@/components/public";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = (await getServices()).find((s) => s.slug === slug);
  return {
    title: s?.seo_title || s?.title,
    description: s?.seo_description || s?.description,
    alternates: {
      canonical: new URL(
        "/services/" + slug,
        process.env.APP_URL || "http://localhost:3000",
      ).toString(),
    },
  };
}
export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const all = await getServices();
  const s = all.find((x) => x.slug === slug);
  if (!s) notFound();
  return (
    <>
      <section className="page-hero service-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/services">Services</Link>
            <span>/</span>
            {s.title}
          </div>
          <span className="eyebrow">{s.division}</span>
          <div className="service-intro">
            <div>
              <h1>{s.title}</h1>
              <p>{s.description}</p>
              <Link
                className="button"
                href={"/contact?service=" + encodeURIComponent(s.title)}
              >
                Discuss your project
              </Link>
            </div>
            <div className="service-emblem">
              {s.image ? (
                <CMSImage src={s.image} alt={s.title} />
              ) : (
                <Icon name={s.icon} />
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container split">
          <div>
            <span className="eyebrow">A CONSIDERED APPROACH</span>
            <h2>Designed around your business.</h2>
            <p className="section-lead">{s.body}</p>
          </div>
          <div className="included-panel">
            <h3>What’s included</h3>
            <ul className="check-list">
              {s.features.map((f) => (
                <li key={f}>
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container solution-grid">
          <article>
            <span className="eyebrow">WHO IT’S FOR</span>
            <h2>The right fit.</h2>
            <p>{s.audience}</p>
          </article>
          <article>
            <span className="eyebrow">BUSINESS BENEFITS</span>
            <h2>A practical difference.</h2>
            <p>{s.benefits}</p>
          </article>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <span className="eyebrow">FROM DISCOVERY TO DELIVERY</span>
          <h2>A clear process, together.</h2>
          <div className="delivery-steps">
            {s.process.split("→").map((step) => (
              <div key={step}>
                <Check size={20} />
                <h3>{step.trim()}</h3>
              </div>
            ))}
          </div>
          <div className="subsection">
            <FAQList items={s.faqs} />
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container">
          <h2>Connected expertise.</h2>
          <div className="services-grid">
            {all
              .filter((x) => x.id !== s.id)
              .slice(0, 3)
              .map((x) => (
                <ServiceCard key={x.id} service={x} />
              ))}
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
