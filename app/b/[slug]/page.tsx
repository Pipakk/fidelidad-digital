"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useBusinessConfig } from "@/lib/client/useBusinessConfig";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/themes/ThemeContext";

export default function BarLanding() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const { data: cfgData, loading: cfgLoading } = useBusinessConfig(slug);
  const cfg = cfgData?.config;
  const business = cfgData?.business;

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? null);
      setLoading(false);
    })();
  }, [supabase]);

  const theme = useTheme();
  const c = theme.color;
  const t = theme.tokens;

  if (loading || cfgLoading || !cfg) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: c.background,
          color: c.text,
          fontFamily: t.font.sans,
        }}
      >
        <span style={{ fontSize: 15, color: c.secondary }}>{cfg?.texts?.common?.loading ?? "Cargando…"}</span>
      </main>
    );
  }

  if (!business) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: c.background,
          color: c.text,
          fontFamily: t.font.sans,
        }}
      >
        <span style={{ fontSize: 15, color: c.secondary }}>{cfg.texts?.landing?.error_not_found ?? "Negocio no encontrado."}</span>
      </main>
    );
  }

  const name = cfg.branding?.name || business.name;
  const logoUrl = cfg.branding?.logo_url || business.logo_url;
  const wheelEnabled = Boolean(cfg.features?.wheel && cfg.wheel?.enabled);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: t.space.xl,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: c.background,
        color: c.text,
        fontFamily: t.font.sans,
      }}
    >
      <div style={{ width: "min(420px, 100%)", textAlign: "center" }}>
        {/* Logo centrado — estilo line-art como en mockup */}
        <div
          style={{
            width: 88,
            height: 88,
            margin: "0 auto",
            borderRadius: t.radius,
            overflow: "hidden",
            border: `1px solid ${c.border}`,
            background: c.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: t.space.lg,
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: c.secondary }}>
              <path d="M10 40V20h6v2h2v-2h6v20h-2V24h-2v16h-2V24h-2v16H10z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
              <path d="M14 26h2v2h-2zM20 26h2v2h-2z" stroke="currentColor" strokeWidth="1" fill="none" />
              <path d="M32 18c0-2.2 1.8-4 4-4s4 1.8 4 4v3H32v-3z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M34 24v6h4v-6M36 26v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          )}
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: t.font.weight.semibold,
            color: c.text,
            marginBottom: t.space.xs,
            lineHeight: 1.2,
          }}
        >
          {name}
        </h1>
        <p style={{ fontSize: 15, color: c.secondary, marginBottom: t.space.xl }}>
          {cfg.texts?.landing?.subtitle ?? "Programa de fidelización"}
        </p>

        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: t.space.sm, justifyContent: "center" }}>
          {!userId ? (
            <>
              <Button variant="primaryDark" onClick={() => router.push(`/b/${slug}/login`)} style={{ flex: "1 1 140px", minWidth: 140 }}>
                {cfg.texts?.landing?.cta_start ?? "Acceder"}
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/b/${slug}/wallet`)} style={{ flex: "1 1 140px", minWidth: 140 }}>
                {cfg.texts?.landing?.cta_premium ?? "Ver premios"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="primaryDark" onClick={() => router.push(`/b/${slug}/wallet`)} style={{ flex: "1 1 140px", minWidth: 140 }}>
                {cfg.texts?.landing?.cta_wallet ?? "Mi wallet"}
              </Button>
              {wheelEnabled && (
                <Button variant="secondary" onClick={() => router.push(`/b/${slug}/spin`)} style={{ flex: "1 1 140px", minWidth: 140 }}>
                  {cfg.texts?.landing?.cta_wheel ?? "Ruleta"}
                </Button>
              )}
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setUserId(null);
                }}
                style={{
                  width: "100%",
                  padding: t.space.sm,
                  background: "transparent",
                  border: "none",
                  color: c.secondary,
                  fontSize: 13,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {cfg.texts?.landing?.logout ?? "Cerrar sesión"}
              </button>
            </>
          )}
        </div>

        <p style={{ marginTop: t.space.xl, fontSize: 11, color: c.secondary, lineHeight: 1.4 }}>
          {cfg.texts?.landing?.privacy_line_1}
          <br />
          {cfg.texts?.landing?.privacy_line_2}
        </p>
      </div>
    </main>
  );
}
