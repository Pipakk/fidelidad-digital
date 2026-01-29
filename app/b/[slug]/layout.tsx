import type { Metadata } from "next";
import { ConfigService } from "@/lib/config/ConfigService";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { config, business } = await ConfigService.getConfig(params.slug);
  const title = config.seo.title || config.branding.name || business?.name || "Loyalty MVP";
  const description = config.seo.description || "Sellos + Ruleta para bares";

  const icons = config.branding.favicon_url ? { icon: config.branding.favicon_url } : undefined;
  return { title, description, icons };
}

export default function BarLayout({ children }: { children: React.ReactNode }) {
  return children;
}

