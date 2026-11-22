import { cache } from "react";
import { query, one } from "./db";
import * as defaults from "./defaults";
import type { Service, Plan, Settings, Section, FAQ, Page } from "./types";
const configured = () =>
  Boolean(
    process.env.DATABASE_URL ||
    (process.env.LOCAL_DATABASE === "true" &&
      process.env.NODE_ENV !== "production"),
  );
export const getSettings = cache(async (): Promise<Settings> =>
  configured()
    ? {
        ...defaults.settings,
        ...(
          await one<{ data: Settings }>(
            "SELECT data FROM site_settings WHERE id=$1",
            ["main"],
          )
        )?.data,
      }
    : defaults.settings,
);
export const getServices = cache(async (): Promise<Service[]> =>
  configured()
    ? query<Service>(
        "SELECT * FROM services WHERE published=true ORDER BY position,title",
      )
    : defaults.services,
);
export const getPlans = cache(async (): Promise<Plan[]> =>
  configured()
    ? query<Plan>(
        "SELECT * FROM pricing_plans WHERE visible=true ORDER BY position,name",
      )
    : defaults.plans,
);
export const getFAQs = cache(async (): Promise<FAQ[]> =>
  configured()
    ? query<FAQ>(
        "SELECT * FROM faqs WHERE visible=true AND service_id IS NULL ORDER BY position",
      )
    : defaults.faqs,
);
export const getSections = cache(async (): Promise<Section[]> =>
  configured()
    ? query<Section>(
        "SELECT * FROM homepage_sections WHERE visible=true ORDER BY position",
      )
    : defaults.sections,
);
export const getPages = cache(async (): Promise<Page[]> =>
  configured() ? query<Page>("SELECT * FROM page_content") : defaults.pages,
);
export const getPage = cache(async (slug: string) =>
  (await getPages()).find((p) => p.slug === slug),
);

export const getMediaAlt = cache(async (url: string, fallback: string) =>
  configured()
    ? (
        await one<{ alt: string }>(
          "SELECT alt FROM media_assets WHERE url=$1 LIMIT 1",
          [url],
        )
      )?.alt || fallback
    : fallback,
);
