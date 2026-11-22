import type { Metadata } from "next";
import type { Page } from "./types";
export function pageMetadata(page: Page | undefined, path: string): Metadata {
  const base = process.env.APP_URL || "http://localhost:3000";
  return {
    title: page?.seo_title || page?.title,
    description: page?.seo_description || page?.description,
    alternates: {
      canonical: page?.canonical || new URL(path, base).toString(),
    },
    robots: { index: !page?.noindex, follow: true },
    openGraph: {
      title: page?.seo_title || page?.title,
      description: page?.seo_description || page?.description,
      url: new URL(path, base).toString(),
      ...(page?.og_image ? { images: [page.og_image] } : {}),
    },
  };
}
