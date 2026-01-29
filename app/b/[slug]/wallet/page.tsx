"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useBusinessConfig } from "@/lib/client/useBusinessConfig";

type Membership = {
  id: string;
  bar_id: string;
  customer_id: string;
  stamps_count: number;
  updated_at: string;
};

type Reward = {
  id: string;
  title: string;
  source: string; // "wheel" | "stamps" | ...
  status: string; // "active" | "redeemed" | "expired"
  expires_at: string;
  created_at: string;
};

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("es-ES");
  } catch {
    return d;
  }
}

function StampDot({ filled }: { filled: boolean }) {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: 999,
        background: filled ? "linear-gradient(180deg, #34d399, #10b981)" : "rgba(255,255,255,0.12)",
        border: filled ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.18)",
        boxShadow: filled ? "0 8px 18px rgba(16,185,129,0.20)" : "none",
      }}
    />
  );
}

export default function WalletPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [customerId, setCustomerId] = useState<string | null>(null);

  const [membership, setMembership] = useState<Membership | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const { data: cfgData, loading: cfgLoading } = useBusinessConfig(slug);
  const cfg = cfgData?.config;
  const business = cfgData?.business;

  // Load auth + bar + wallet info
  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id || null;
      setCustomerId(uid);
      if (!cfgData?.business || !cfg) {
        setLoading(false);
        return;
      }

      if (!uid) {
        setLoading(false);
        return;
      }

      // Membership (sellos)
      const { data: m } = await supabase
        .from("memberships")
        .select("id,bar_id,customer_id,stamps_count,updated_at")
        .eq("bar_id", cfgData.business.id)
        .eq("customer_id", uid)
        .maybeSingle();

      setMembership(
        (m as any) ?? {
          id: "tmp",
          bar_id: cfgData.business.id,
          customer_id: uid,
          stamps_count: 0,
          updated_at: new Date().toISOString(),
        }
      );

      // Rewards activos
      const { data: r } = await supabase
        .from("rewards")
        .select("id,title,source,status,expires_at,created_at")
        .eq("bar_id", cfgData.business.id)
        .eq("customer_id", uid)
        .eq("status", "active")
        .order("expires_at", { ascending: true });

      setRewards((r as any) || []);
      setLoading(false);
    })();
  }, [slug, cfgData?.business?.id, cfgLoading]);

  async function refresh() {
    if (!business || !customerId) return;

    const { data: m } = await supabase
      .from("memberships")
      .select("id,bar_id,customer_id,stamps_count,updated_at")
      .eq("bar_id", business.id)
      .eq("customer_id", customerId)
      .maybeSingle();

    setMembership(
      (m as any) ?? {
        id: "tmp",
        bar_id: business.id,
        customer_id: customerId,
        stamps_count: 0,
        updated_at: new Date().toISOString(),
      }
    );

    const { data: r } = await supabase
      .from("rewards")
      .select("id,title,source,status,expires_at,created_at")
      .eq("bar_id", business.id)
      .eq("customer_id", customerId)
      .eq("status", "active")
      .order("expires_at", { ascending: true });

    setRewards((r as any) || []);
  }

  async function addStamp() {
    if (!business || !cfg) return;
    if (!customerId) {
      router.push(`/b/${slug}/login`);
      return;
    }
    if (!pin.trim()) return alert(cfg.texts.wallet.pin_missing_add_stamp);

    setBusy(true);
    const res = await fetch("/api/stamp/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barSlug: slug, customerId, pin }),
    });

    const data = await res.json();
    setBusy(false);

    if (!res.ok) return alert(data.error || cfg.texts.common.error_generic);
    setPin("");
    await refresh();
  }

  async function redeemReward(rewardId: string) {
    if (!business || !cfg) return;
    if (!customerId) {
      router.push(`/b/${slug}/login`);
      return;
    }
    if (!pin.trim()) return alert(cfg.texts.wallet.pin_missing_redeem);

    setBusy(true);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barSlug: slug, customerId, pin, rewardId }),
    });

    const data = await res.json();
    setBusy(false);

    if (!res.ok) return alert(data.error || cfg.texts.common.error_generic);
    setPin("");
    await refresh();
  }

  const stampsGoal = cfg?.stamps.goal ?? 8;
  const stamps = membership?.stamps_count ?? 0;
  const wheelEnabled = Boolean(cfg?.features.wheel && cfg?.wheel.enabled);
  const background =
    cfg?.branding.theme.background ||
    "radial-gradient(1200px 600px at 20% 10%, rgba(255,186,73,.35), transparent 60%)," +
      "radial-gradient(900px 500px at 90% 20%, rgba(52,211,153,.30), transparent 55%)," +
      "radial-gradient(900px 500px at 30% 90%, rgba(248,113,113,.25), transparent 55%)," +
      "linear-gradient(180deg, #0b1220 0%, #0a0f1a 100%)";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background,
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "min(640px, 100%)",
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
              width: 50,
              height: 50,
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
            {cfg?.branding.logo_url || business?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(cfg?.branding.logo_url || business?.logo_url) as string}
                alt="logo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 24 }}>🍻</span>
            )}
          </div>

          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: 0.4 }}>{cfg?.texts.wallet.title_kicker ?? "Tu wallet"}</div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15 }}>
              {cfg?.branding.name || business?.name || "Bar"}
            </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {wheelEnabled && (
              <button
                onClick={() => router.push(`/b/${slug}/spin`)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "linear-gradient(90deg, #fde68a, #34d399)",
                  border: "none",
                  color: "#0b1220",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {cfg?.texts.wallet.cta_wheel ?? "🎡 Ruleta"}
              </button>
            )}
            <button
              onClick={() => router.push(`/b/${slug}`)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Volver
            </button>
          </div>
        </div>

        {/* Sellos */}
        <div
          style={{
            borderRadius: 16,
            padding: 14,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{cfg?.texts.wallet.section_stamps ?? "Tus sellos"}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              {stamps}/{stampsGoal}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            {Array.from({ length: stampsGoal }).map((_, idx) => (
              <StampDot key={idx} filled={idx < stamps} />
            ))}
          </div>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>
            {cfg?.texts.wallet.reward_for_completion ?? "Premio por completar:"}{" "}
            <strong>{cfg?.stamps.reward_title || "Premio"}</strong>
          </div>
        </div>

        {/* Staff PIN + acciones */}
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <div
            style={{
              borderRadius: 16,
              padding: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800 }}>{cfg?.texts.wallet.staff_actions_title ?? "Acciones (staff)"}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
              {cfg?.texts.wallet.staff_actions_subtitle ??
                "El camarero introduce el PIN del bar para validar consumo o canjear premios."}
            </div>

            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={cfg?.texts.wallet.pin_placeholder ?? "PIN (ej. 1234)"}
              style={{
                width: "100%",
                marginTop: 12,
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(0,0,0,0.25)",
                color: "#fff",
                outline: "none",
              }}
            />

            <button
              onClick={addStamp}
              disabled={busy}
              style={{
                width: "100%",
                marginTop: 10,
                padding: 12,
                borderRadius: 14,
                fontWeight: 900,
                border: "none",
                cursor: busy ? "not-allowed" : "pointer",
                color: "#0b1220",
                background: busy
                  ? "linear-gradient(90deg, rgba(255,255,255,0.45), rgba(255,255,255,0.35))"
                  : "linear-gradient(90deg, #fde68a, #34d399)",
              }}
            >
              {busy ? cfg?.texts.wallet.processing ?? "Procesando..." : cfg?.texts.wallet.add_stamp ?? "Añadir 1 sello"}
            </button>
          </div>

          {/* Premios activos */}
          <div
            style={{
              borderRadius: 16,
              padding: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800 }}>{cfg?.texts.wallet.rewards_title ?? "Premios activos"}</div>

            {loading ? (
              <div style={{ marginTop: 10, opacity: 0.85 }}>{cfg?.texts.common.loading ?? "Cargando..."}</div>
            ) : rewards.length === 0 ? (
              <div style={{ marginTop: 10, opacity: 0.85 }}>{cfg?.texts.wallet.rewards_empty ?? "Aún no tienes premios activos."}</div>
            ) : (
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                {rewards.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      borderRadius: 14,
                      padding: 12,
                      background: "rgba(0,0,0,0.22)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 900 }}>{r.title}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        {r.source === "wheel" ? "🎡" : "🏷️"} {r.source}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.85 }}>
                      {(cfg?.texts.wallet.rewards_expires_at ?? "Caduca:")} {formatDate(r.expires_at)}
                    </div>

                    <button
                      onClick={() => redeemReward(r.id)}
                      disabled={busy}
                      style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        cursor: busy ? "not-allowed" : "pointer",
                        fontWeight: 800,
                      }}
                    >
                      {cfg?.texts.wallet.redeem ?? "Canjear (staff)"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75, textAlign: "center" }}>
          {cfg?.texts.wallet.tip ?? "Consejo: guarda esta página en tu pantalla de inicio para abrirla como app."}
        </div>
      </div>
    </main>
  );
}
