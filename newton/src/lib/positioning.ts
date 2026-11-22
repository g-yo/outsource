import type { Settings } from "./types";

export const cloudSettings: Partial<Settings> = {
  heroEyebrow: "CLOUD · SECURITY · DEVOPS",
  heroTitle: "Your cloud.\nSecurely managed.\nReady to grow.",
  heroSubtitle:
    "We manage your cloud, migrate your infrastructure, strengthen security, and automate delivery. Practical IT expertise to keep your business running, with development and application support when you need it.",
  heroNote: "Cloud operations, security, and DevOps. One accountable partner.",
  heroCta: "Discuss your infrastructure",
  companyDescription:
    "newTon provides managed IT, cloud infrastructure, cybersecurity, and DevOps services. We help businesses migrate to the cloud, manage existing environments, secure systems, and automate operations. When needed, we also develop, modernize, and maintain applications.",
  footer: "Cloud, security, and DevOps expertise for your business.",
  trustItems: [
    "Managed cloud operations",
    "Planned cloud migrations",
    "Security-first infrastructure",
    "DevOps automation",
  ],
  whyItems: [
    "Operations-first expertise|Cloud administration, server maintenance, and ongoing support built around your environment.",
    "Security in every layer|Access controls, infrastructure hardening, and practical remediation considered together.",
    "Clear technical ownership|Documented responsibilities, escalation paths, and regular operational reviews.",
    "Development when needed|Application development, modernization, and maintenance to complement your infrastructure.",
  ],
  processSteps: [
    "Assess|Review your workloads, infrastructure, access, and operational priorities.",
    "Plan|Agree the architecture, migration approach, responsibilities, and support scope.",
    "Migrate & configure|Move workloads or improve existing environments with validation and rollback plans.",
    "Secure|Harden systems, review permissions, and address prioritized risks.",
    "Monitor|Track infrastructure health, backups, and operational incidents.",
    "Optimize|Improve cloud costs, performance, and delivery automation.",
  ],
  ctaEyebrow: "A PRACTICAL NEXT STEP",
  ctaTitle: "Need a team to manage your cloud?",
  ctaDescription:
    "Tell us about your infrastructure, migration plans, or support needs.",
  ctaButton: "Talk to our team",
};

export const serviceOrder = [
  "managed-cloud-services",
  "cloud-migration",
  "cybersecurity",
  "devops-automation",
  "server-management",
  "cloud-hosting",
  "security-auditing",
  "custom-software-development",
  "web-development",
];
export const planOrder = [
  "Managed infrastructure",
  "Managed servers",
  "Security assessment",
  "Enterprise partnership",
  "Managed website",
  "Project delivery",
];
export const sectionCopy: Record<
  string,
  { title: string; description: string }
> = {
  services: {
    title: "Cloud. Security. DevOps. Handled.",
    description:
      "From migrating workloads to managing day-to-day operations, we help you run technology with confidence.",
  },
  why: {
    title: "One team behind your infrastructure.",
    description:
      "Bring cloud operations, security, and delivery automation together, with application expertise available when required.",
  },
  process: {
    title: "From assessment to ongoing operations.",
    description:
      "A clear plan for your cloud, with security and operational support built in.",
  },
  managed: {
    title: "Your infrastructure needs an ongoing partner.",
    description:
      "We manage existing cloud accounts, Linux and Windows servers, monitoring, patching, and backups. Get practical support for AWS, Azure, Google Cloud, and hybrid environments.",
  },
  pricing: {
    title: "Support shaped around your environment.",
    description:
      "Monthly cloud and server management, scoped migrations, security assessments, and tailored DevOps engagements.",
  },
};
export const pageCopy: Record<
  string,
  { title: string; description: string; body?: string }
> = {
  home: {
    title: "Managed Cloud, IT, Security & DevOps Services",
    description: cloudSettings.heroSubtitle!,
  },
  about: {
    title: "Your team for cloud and IT operations.",
    description:
      "Cloud management, migration, cybersecurity, and DevOps are at the heart of what we do.",
    body: "We help businesses operate and improve the technology they depend on. Our focus is managing cloud infrastructure, planning migrations, maintaining servers, strengthening security, and automating deployments.\n\nWe can work with your existing AWS, Microsoft Azure, or Google Cloud accounts, as well as hybrid and on-premises environments. Each engagement starts with a review of your systems and a clear agreement on responsibilities.\n\nWhen your infrastructure needs an application or integration, we can also develop, modernize, and manage software. Development supports your wider operational needs.\n\nWe value clear communication, documented changes, practical security, and support that continues beyond a migration or deployment.",
  },
  services: {
    title: "Cloud and IT expertise, when you need it.",
    description:
      "Managed cloud, migration, server operations, cybersecurity, and DevOps. Application development and maintenance are available as supporting services.",
  },
  solutions: {
    title: "Practical solutions for your infrastructure.",
    description:
      "Move to the cloud, improve existing operations, and bring security and automation into everyday delivery.",
    body: "Manage your existing cloud|Cloud account administration, monitoring, maintenance, cost reviews, and ongoing operational support.\nMigrate to the cloud|Workload discovery, dependency mapping, migration planning, execution, validation, and post-migration support.\nStrengthen infrastructure security|Security assessments, access reviews, server hardening, vulnerability management, and remediation support.\nAutomate deployment and operations|CI/CD pipelines, containers, infrastructure as code, and repeatable workflows for your team.\nSupport your servers and applications|Linux and Windows server management, backup reviews, patching, and application maintenance.\nDevelop what your operations need|Custom applications, websites, integrations, or modernization when your business requires additional development.",
  },
  contact: {
    title: "Let's talk about your infrastructure.",
    description:
      "Tell us what you need to manage, migrate, secure, or automate. We can also help with application development and support when required.",
  },
};
