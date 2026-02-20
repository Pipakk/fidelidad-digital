import type { Metadata } from "next";
import { ConfigService } from "@/lib/config/ConfigService";
import { BarThemeWrapper } from "@/components/providers/BarThemeWrapper";
import { theme } from "@/lib/theme";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { config, business } = await ConfigService.getConfig(slug);
  if (!business) {
    return { title: "Negocio no encontrado" };
  }
  const title = config.seo?.title || config.branding?.name || business.name || "Loyalty MVP";
  const description = config.seo?.description || "Fidelización";
  const icons = config.branding?.favicon_url ? { icon: config.branding.favicon_url } : undefined;
  return { title, description, icons };
}

export default async function BarLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { business } = await ConfigService.getConfig(slug);

  if (!business) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.color.ivory,
          color: theme.color.text,
          fontFamily: theme.font.sans,
          padding: theme.space.lg,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <p style={{ fontSize: 18, fontWeight: theme.font.weight.medium, color: theme.color.text, marginBottom: theme.space.xs }}>
            Negocio no encontrado
          </p>
          <p style={{ fontSize: 14, color: theme.color.camelDark }}>
            La dirección no corresponde a un establecimiento válido.
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: theme.space.lg,
              padding: theme.space.sm,
              borderRadius: theme.radius,
              border: `1px solid ${theme.color.camel}`,
              color: theme.color.camelDark,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: theme.font.weight.medium,
            }}
          >
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  return <BarThemeWrapper slug={slug}>{children}</BarThemeWrapper>;
}
