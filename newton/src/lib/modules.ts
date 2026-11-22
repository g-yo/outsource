export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "list"
    | "number"
    | "checkbox"
    | "select"
    | "json"
    | "url";
  options?: string[];
  help?: string;
};
export type Module = {
  title: string;
  description: string;
  table: string;
  label: string;
  fields: Field[];
  defaults: Record<string, unknown>;
  singleton?: boolean;
  noCreate?: boolean;
};
const position: Field = {
  key: "position",
  label: "Display order",
  type: "number",
};
const seo: Field[] = [
  { key: "seo_title", label: "Search title" },
  { key: "seo_description", label: "Search description", type: "textarea" },
];
export const modules: Record<string, Module> = {
  content: {
    title: "Website content",
    description: "Edit page copy, legal pages, and search metadata.",
    table: "page_content",
    label: "title",
    noCreate: true,
    fields: [
      {
        key: "slug",
        label: "Page route",
        help: "Keep existing route names unchanged.",
      },
      { key: "title", label: "Page title" },
      { key: "description", label: "Page introduction", type: "textarea" },
      {
        key: "body",
        label: "Page content",
        type: "textarea",
        help: "Separate paragraphs with a blank line. For solutions and industries: one Title|Description per line.",
      },
      ...seo,
      { key: "canonical", label: "Canonical HTTPS URL", type: "url" },
      { key: "og_image", label: "Open Graph image URL", type: "url" },
      { key: "noindex", label: "Hide from search engines", type: "checkbox" },
    ],
    defaults: {},
  },
  sections: {
    title: "Homepage sections",
    description:
      "Arrange sections, update introductions, and control visibility.",
    table: "homepage_sections",
    label: "title",
    noCreate: true,
    fields: [
      { key: "slug", label: "Section type" },
      { key: "title", label: "Section heading" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "image", label: "Image HTTPS URL", type: "url" },
      {
        key: "background",
        label: "Background",
        type: "select",
        options: ["light", "soft", "dark"],
      },
      position,
      { key: "visible", label: "Visible on homepage", type: "checkbox" },
    ],
    defaults: {},
  },
  services: {
    title: "Services",
    description:
      "Manage your expertise, detailed service pages, and publication status.",
    table: "services",
    label: "title",
    fields: [
      { key: "title", label: "Service title" },
      { key: "slug", label: "URL slug" },
      {
        key: "division",
        label: "Division",
        type: "select",
        options: [
          "Software engineering",
          "Cloud & operations",
          "Cybersecurity",
        ],
      },
      { key: "description", label: "Short description", type: "textarea" },
      { key: "body", label: "Detailed overview", type: "textarea" },
      { key: "audience", label: "Who this is for", type: "textarea" },
      { key: "benefits", label: "Business benefits", type: "textarea" },
      {
        key: "process",
        label: "Delivery process",
        help: "Separate steps with →",
      },
      { key: "features", label: "Included features", type: "list" },
      {
        key: "faqs",
        label: "Service FAQs",
        type: "json",
        help: 'JSON array: [{"question":"…","answer":"…"}]',
      },
      {
        key: "icon",
        label: "Icon",
        type: "select",
        options: ["code", "cloud", "server", "shield", "workflow"],
      },
      { key: "image", label: "Image HTTPS URL", type: "url" },
      ...seo,
      position,
      { key: "published", label: "Published", type: "checkbox" },
    ],
    defaults: {
      title: "",
      slug: "",
      division: "Software engineering",
      description: "",
      body: "",
      audience: "",
      benefits: "",
      process: "",
      features: [],
      faqs: [],
      icon: "code",
      image: "",
      seo_title: "",
      seo_description: "",
      position: 0,
      published: false,
    },
  },
  pricing: {
    title: "Pricing plans",
    description:
      "Publish scoped engagements in INR, USD, or AED. Leave amount blank for a quote.",
    table: "pricing_plans",
    label: "name",
    fields: [
      { key: "name", label: "Plan name" },
      { key: "description", label: "Description", type: "textarea" },
      {
        key: "amount",
        label: "Price amount",
        type: "number",
        help: "Leave blank to display Contact for quote.",
      },
      {
        key: "currency",
        label: "Currency",
        type: "select",
        options: ["USD", "INR", "AED"],
      },
      {
        key: "interval",
        label: "Billing interval",
        type: "select",
        options: ["month", "year", "project", "assessment"],
      },
      { key: "features", label: "Included features", type: "list" },
      { key: "addons", label: "Optional add-ons", type: "list" },
      { key: "cta", label: "Button label" },
      {
        key: "service_id",
        label: "Related service ID",
        help: "Optional UUID from a service record.",
      },
      position,
      { key: "popular", label: "Highlight plan", type: "checkbox" },
      { key: "visible", label: "Published", type: "checkbox" },
    ],
    defaults: {
      name: "",
      description: "",
      amount: null,
      currency: "USD",
      interval: "month",
      features: [],
      addons: [],
      cta: "Request a quote",
      service_id: null,
      position: 0,
      popular: false,
      visible: false,
    },
  },
  faqs: {
    title: "Frequently asked questions",
    description: "Answers shown on your homepage and pricing page.",
    table: "faqs",
    label: "question",
    fields: [
      { key: "question", label: "Question" },
      { key: "answer", label: "Answer", type: "textarea" },
      position,
      { key: "visible", label: "Published", type: "checkbox" },
    ],
    defaults: { question: "", answer: "", position: 0, visible: true },
  },
  leads: {
    title: "Inquiries",
    description: "Review requests, track follow-up, and keep internal notes.",
    table: "contact_inquiries",
    label: "name",
    noCreate: true,
    fields: [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["new", "contacted", "qualified", "closed"],
      },
      { key: "notes", label: "Internal notes", type: "textarea" },
    ],
    defaults: {},
  },
  media: {
    title: "Media library",
    description:
      "Upload to durable object storage or register an HTTPS image URL.",
    table: "media_assets",
    label: "name",
    fields: [
      { key: "name", label: "Asset name" },
      { key: "url", label: "Image HTTPS URL", type: "url" },
      { key: "alt", label: "Alternative text" },
    ],
    defaults: { name: "", url: "", alt: "" },
  },
  settings: {
    title: "Company settings",
    description:
      "Your identity, homepage hero, contact details, and operating process.",
    table: "site_settings",
    label: "businessName",
    singleton: true,
    fields: [
      { key: "businessName", label: "Company name" },
      { key: "tagline", label: "Brand descriptor" },
      { key: "logo", label: "Logo HTTPS URL", type: "url" },
      { key: "favicon", label: "Favicon HTTPS URL", type: "url" },
      { key: "heroEyebrow", label: "Hero introductory label" },
      { key: "heroNote", label: "Hero reassurance note" },
      {
        key: "whyItems",
        label: "Why choose us cards",
        type: "list",
        help: "One Title|Description per line.",
      },
      {
        key: "managedFeatures",
        label: "Managed services benefits",
        type: "list",
      },
      { key: "ctaEyebrow", label: "Consultation section label" },
      { key: "ctaTitle", label: "Consultation section heading" },
      { key: "ctaDescription", label: "Consultation section description" },
      { key: "ctaButton", label: "Consultation button text" },
      {
        key: "heroTitle",
        label: "Homepage headline",
        type: "textarea",
        help: "One line per visual line.",
      },
      { key: "heroSubtitle", label: "Homepage introduction", type: "textarea" },
      { key: "heroCta", label: "Homepage button label" },
      {
        key: "companyDescription",
        label: "Company description",
        type: "textarea",
      },
      { key: "trustItems", label: "Trust statements", type: "list" },
      {
        key: "processSteps",
        label: "Process steps",
        type: "list",
        help: "One Title|Description per line.",
      },
      { key: "supportEmail", label: "Public contact email" },
      { key: "notificationEmail", label: "Private inquiry notification email" },
      { key: "phone", label: "Public phone" },
      {
        key: "whatsapp",
        label: "WhatsApp number",
        help: "International digits, including country code.",
      },
      { key: "address", label: "Office address", type: "textarea" },
      {
        key: "defaultCurrency",
        label: "Default currency",
        type: "select",
        options: ["USD", "INR", "AED"],
      },
      { key: "socialLinks", label: "Social profile HTTPS URLs", type: "list" },
      { key: "footer", label: "Footer description" },
    ],
    defaults: {},
  },
};
