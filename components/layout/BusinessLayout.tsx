"use client";

import { theme } from "@/lib/theme";

type BusinessLayoutProps = {
  children: React.ReactNode;
  /** Si no hay negocio, se muestra este contenido (ej. "Negocio no encontrado") */
  notFound?: React.ReactNode;
  /** Si está cargando */
  loading?: boolean;
};

export function BusinessLayout({ children, notFound, loading }: BusinessLayoutProps) {
  if (loading) {
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
        }}
      >
        <span style={{ fontSize: 15, color: theme.color.camelDark }}>Cargando…</span>
      </main>
    );
  }

  if (notFound) {
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
        {notFound}
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: theme.color.ivory,
        color: theme.color.text,
        fontFamily: theme.font.sans,
      }}
    >
      {children}
    </main>
  );
}
