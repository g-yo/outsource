import type { Metadata } from "next";
import "./globals.css";
import "./admin.css";
import { getSettings } from "@/lib/content";
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: {
      default: `${s.businessName} — Software, Cloud & Cybersecurity`,
      template: `%s | ${s.businessName}`,
    },
    description: s.companyDescription,
    icons: { icon: s.favicon || "/favicon.svg" },
  };
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
