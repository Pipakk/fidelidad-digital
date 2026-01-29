"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useBusinessConfig } from "@/lib/client/useBusinessConfig";

type Bar = { id: string; name: string; slug: string; logo_url: string | null };

export default function BarLandingPage() {
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
  }, [slug]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          cfg?.branding.theme.background ||
          "radial-gradient(1200px 600px at 20% 10%, rgba(255,186,73,.35), transparent 60%)," +
            "radial-gradient(900px 500px at 90% 20%, rgba(52,211,153,.30), transparent 55%)," +
            "radial-gradient(900px 500px at 30% 90%, rgba(248,113,113,.25), transparent 55%)," +
            "linear-gradient(180deg, #0b1220 0%, #0a0f1a 100%)",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          borderRadius: 20,
          padding: 18,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              overflow: "hidden",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {cfg?.branding.logo_url || bar?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(cfg?.branding.logo_url || bar?.logo_url) as string}
                alt="logo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 26 }}>🍻</span>
            )}
          </div>

          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: 0.4 }}>
              {cfg?.texts.landing.welcome_kicker ?? "Bienvenido a"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15 }}>{cfg?.branding.name || bar?.name || slug}</div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
              {cfg?.texts.landing.subtitle ?? "Consigue sellos y gira la ruleta para premios."}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <button
            onClick={() => router.push(`/b/${slug}/login`)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 800,
              color: "#0b1220",
              background: "linear-gradient(90deg, #fde68a, #34d399)",
              border: "none",
              cursor: "pointer",
            }}
          >
            {cfg?.texts.landing.cta_start ?? "Entrar / Crear cuenta"}
          </button>

          <button
            onClick={() => router.push(`/b/${slug}/wallet`)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 14,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {cfg?.texts.landing.cta_wallet ?? "Ver mis sellos"}
          </button>

          {cfg?.features.wheel && cfg?.wheel.enabled && (
            <button
              onClick={() => router.push(`/b/${slug}/spin`)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {cfg?.texts.landing.cta_wheel ?? "Girar la ruleta"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
