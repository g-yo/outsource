import type { MetadataRoute } from "next";
import { getPages, getServices } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL || "http://localhost:3000";
  const [pages, services] = await Promise.all([getPages(), getServices()]);
  return [
    ...pages
      .filter((p) => !p.noindex)
      .map((p) => ({
        url: new URL(p.slug === "home" ? "/" : "/" + p.slug, base).toString(),
      })),
    ...services.map((s) => ({
      url: new URL("/services/" + s.slug, base).toString(),
    })),
  ];
}
