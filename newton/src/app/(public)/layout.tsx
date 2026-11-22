import { Header } from "@/components/ui";
import { Footer } from "@/components/public";
import { getSettings, getServices } from "@/lib/content";
import { ScrollReveal } from "@/components/scroll-reveal";
export const dynamic = "force-dynamic";
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, services] = await Promise.all([
    getSettings(),
    getServices(),
  ]);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header
        settings={{ ...settings, notificationEmail: "" }}
        services={services}
      />
      <main id="main">{children}</main>
      <Footer settings={settings} />
      <ScrollReveal />
    </>
  );
}
