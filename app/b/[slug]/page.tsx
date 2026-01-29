"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useBusinessConfig } from "@/lib/client/useBusinessConfig";

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
  }, [slug]);

  if (loading || cfgLoading || !cfg) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#fff", background: "#0b1220" }}>
        {cfg?.texts.common.loading ?? "Cargando..."}
      </main>
    );
  }
  if (!business) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#fff", background: "#0b1220" }}>
        {cfg.texts.landing.error_not_found}
      </main>
    );
  }

  const wheelEnabled = cfg.features.wheel && cfg.wheel.enabled;
  const stampsGoal = cfg.stamps.goal;
  const stampsRewardTitle = cfg.stamps.reward_title || "Premio";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          cfg.branding.theme.background ||
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
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              overflow: "hidden",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {cfg.branding.logo_url || business.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(cfg.branding.logo_url || business.logo_url) as string}
                alt="logo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 28 }}>🍻</span>
            )}
          </div>

          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: 0.4 }}>{cfg.texts.landing.welcome_kicker}</div>
            <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.15 }}>{cfg.branding.name || business.name}</div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
              {cfg.texts.landing.subtitle}
            </div>
          </div>
        </div>

        {/* Info rápida */}
        <div
          style={{
            borderRadius: 16,
            padding: 14,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ opacity: 0.85 }}>Objetivo de sellos</span>
            <strong>{stampsGoal}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ opacity: 0.85 }}>Premio por completar</span>
            <strong>{stampsRewardTitle}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ opacity: 0.85 }}>Ruleta</span>
            <strong>{wheelEnabled ? "Activada" : "No disponible"}</strong>
          </div>
        </div>

        {/* CTA */}
        {!userId ? (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <button
              onClick={() => router.push(`/b/${slug}/login`)}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 900,
                color: "#0b1220",
                background: "linear-gradient(90deg,#fde68a,#34d399)",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
                touchAction: "manipulation",
              }}
            >
              {cfg.texts.landing.cta_start}
            </button>

            <div style={{ fontSize: 12, opacity: 0.78, lineHeight: 1.35, textAlign: "center" }}>
              {cfg.texts.login.subtitle}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <button
              onClick={() => router.push(`/b/${slug}/wallet`)}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 900,
                color: "#0b1220",
                background: "linear-gradient(90deg,#fde68a,#34d399)",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
                touchAction: "manipulation",
              }}
            >
              {cfg.texts.landing.cta_wallet}
            </button>

            {wheelEnabled && (
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
                  fontWeight: 800,
                  touchAction: "manipulation",
                }}
              >
                {cfg.texts.landing.cta_wheel}
              </button>
            )}

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setUserId(null);
              }}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 800,
                opacity: 0.9,
              }}
            >
              {cfg.texts.landing.logout}
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75, textAlign: "center", lineHeight: 1.35 }}>
          {cfg.texts.landing.privacy_line_1}
          <br />
          {cfg.texts.landing.privacy_line_2}
        </div>
      </div>
    </main>
  );
}
