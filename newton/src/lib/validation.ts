import { z } from "zod";
const text = z.string().trim().max(10000);
const short = z.string().trim().max(250);
export const safeUrl = z
  .string()
  .max(2000)
  .refine(
    (v) =>
      !v ||
      (/^https:\/\//i.test(v) &&
        !/[\s<>]/.test(v) &&
        (() => {
          try {
            const u = new URL(v);
            return (
              !u.username &&
              !u.password &&
              !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(
                u.hostname,
              ) &&
              !/(\.local|\.internal)$/i.test(u.hostname)
            );
          } catch {
            return false;
          }
        })()),
    "Use an absolute public HTTPS URL without credentials.",
  );
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(100);
const list = z.array(z.string().trim().min(1).max(500)).max(40);
const order = z.coerce.number().int().min(0).max(10000);
const seo = { seo_title: short, seo_description: z.string().max(500) };
export const schemas = {
  services: z.object({
    slug,
    title: short.min(1),
    division: z.enum([
      "Software engineering",
      "Cloud & operations",
      "Cybersecurity",
    ]),
    description: short.min(1),
    body: text.min(1),
    audience: text,
    benefits: text,
    process: text,
    icon: z.enum(["code", "cloud", "server", "shield", "workflow"]),
    image: safeUrl,
    features: list,
    faqs: z
      .array(z.object({ question: short.min(1), answer: text.min(1) }))
      .max(20),
    ...seo,
    published: z.boolean(),
    position: order,
  }),
  pricing: z.object({
    name: short.min(1),
    description: short,
    amount: z.union([z.null(), z.coerce.number().min(0).max(999999999)]),
    currency: z.enum(["USD", "INR", "AED"]),
    interval: z.enum(["month", "year", "project", "assessment"]),
    features: list,
    addons: list,
    cta: short.min(1),
    popular: z.boolean(),
    position: order,
    visible: z.boolean(),
    service_id: z.union([z.uuid(), z.null()]),
  }),
  pages: z.object({
    slug,
    title: short.min(1),
    description: text,
    body: text,
    ...seo,
    canonical: safeUrl,
    og_image: safeUrl,
    noindex: z.boolean(),
  }),
  sections: z.object({
    slug,
    title: short.min(1),
    description: text,
    image: safeUrl,
    background: z.enum(["light", "dark", "soft"]),
    position: order,
    visible: z.boolean(),
  }),
  faqs: z.object({
    question: short.min(1),
    answer: text.min(1),
    position: order,
    visible: z.boolean(),
  }),
  leads: z.object({
    status: z.enum(["new", "contacted", "qualified", "closed"]),
    notes: text,
  }),
  media: z.object({
    name: short.min(1),
    url: safeUrl.refine(Boolean, "URL required"),
    alt: short,
  }),
  settings: z.object({
    businessName: short.min(1),
    tagline: short,
    heroEyebrow: short,
    heroNote: short,
    whyItems: list,
    managedFeatures: list,
    ctaEyebrow: short,
    ctaTitle: short.min(1),
    ctaDescription: short,
    ctaButton: short.min(1),
    heroTitle: short.min(1),
    heroSubtitle: text,
    heroCta: short.min(1),
    companyDescription: text,
    footer: short,
    supportEmail: z.union([z.email(), z.literal("")]),
    notificationEmail: z.union([z.email(), z.literal("")]),
    phone: short,
    whatsapp: z.string().regex(/^\+?[0-9]{7,15}$|^$/),
    address: text,
    logo: safeUrl,
    favicon: safeUrl,
    defaultCurrency: z.enum(["USD", "INR", "AED"]),
    socialLinks: z.array(safeUrl.refine(Boolean)).max(10),
    trustItems: list,
    processSteps: list,
  }),
};
export const inquirySchema = z.object({
  name: short.min(2),
  company: short.min(1),
  email: z.email().max(254),
  phone: z.string().max(40),
  country: short.min(2),
  service: short.min(1),
  description: z.string().trim().min(30).max(10000),
  budget: short,
  consent: z.literal(true),
  website: z.string().max(200).optional(),
  turnstile: z.string().max(2048).optional(),
});
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r\n]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
