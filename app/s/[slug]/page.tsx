"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useBusinessConfig } from "@/lib/client/useBusinessConfig";
import { Button } from "@/components/ui/Button";
import { theme } from "@/lib/theme";

type Bar = { id: string; name: string; slug: string; logo_url: string | null };

export default function ShortLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [bar, setBar] = useState<Bar | null>(null);
  const { data: cfgData } = useBusinessConfig(slug);
  const cfg = cfgData?.config;

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("bars")
        .select("id,name,slug,logo_url")
        .eq("slug", slug)
        .single();
      if (!error) setBar(data as Bar);
    })();
  }, [slug, supabase]);

  const name = cfg?.branding?.name || bar?.name || slug;
  const logoUrl = cfg?.branding?.logo_url || bar?.logo_url;
  const wheelEnabled = Boolean(cfg?.features?.wheel && cfg?.wheel?.enabled);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: theme.space.xl,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: theme.color.ivory,
        color: theme.color.text,
        fontFamily: theme.font.sans,
      }}
    >
      <div style={{ width: "min(400px, 100%)", textAlign: "center" }}>
        {logoUrl && (
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto",
              borderRadius: theme.radius,
              overflow: "hidden",
              border: `1px solid ${theme.color.border}`,
              marginBottom: theme.space.md,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <h1 style={{ fontSize: 24, fontWeight: theme.font.weight.semibold, marginBottom: theme.space.xs }}>{name}</h1>
        <p style={{ fontSize: 14, color: theme.color.camelDark, marginBottom: theme.space.lg }}>
          {cfg?.texts?.landing?.subtitle ?? "Programa de fidelización"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: theme.space.sm }}>
          <Button onClick={() => router.push(`/b/${slug}/login`)}>
            {cfg?.texts?.landing?.cta_start ?? "Entrar / Crear cuenta"}
          </Button>
          <Button variant="secondary" onClick={() => router.push(`/b/${slug}/wallet`)}>
            {cfg?.texts?.landing?.cta_wallet ?? "Ver mis sellos"}
          </Button>
          {wheelEnabled && (
            <Button variant="secondary" onClick={() => router.push(`/b/${slug}/spin`)}>
              {cfg?.texts?.landing?.cta_wheel ?? "Girar la ruleta"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
