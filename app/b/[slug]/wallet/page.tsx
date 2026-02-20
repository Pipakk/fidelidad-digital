"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useBusinessConfig } from "@/lib/client/useBusinessConfig";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/themes/ThemeContext";

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
  source: string;
  status: string;
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

/** Default stamp (cafe/bar): circle, filled = ☕, unfilled = dot */
function DefaultStampDot({ filled }: { filled: boolean }) {
  const theme = useTheme();
  const c = theme.color;
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: filled ? c.secondary : c.surface,
        border: `1px solid ${filled ? c.textSoft : c.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {filled ? (
        <span style={{ fontSize: 14 }} title="Sello">☕</span>
      ) : (
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: c.secondary }} />
      )}
    </div>
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id || null;
      setCustomerId(uid);

      if (!cfgData?.business || !cfg || !uid) {
        setLoading(false);
        return;
      }

      const { data: m } = await supabase
        .from("memberships")
        .select("id,bar_id,customer_id,stamps_count,updated_at")
        .eq("bar_id", cfgData.business.id)
        .eq("customer_id", uid)
        .maybeSingle();

      setMembership(
        (m as Membership) ?? {
          id: "tmp",
          bar_id: cfgData.business.id,
          customer_id: uid,
          stamps_count: 0,
          updated_at: new Date().toISOString(),
        }
      );

      const { data: r } = await supabase
        .from("rewards")
        .select("id,title,source,status,expires_at,created_at")
        .eq("bar_id", cfgData.business.id)
        .eq("customer_id", uid)
        .eq("status", "active")
        .order("expires_at", { ascending: true });

      setRewards((r as Reward[]) || []);
      setLoading(false);
    })();
  }, [slug, cfgData?.business?.id, cfg]);

  async function refresh() {
    if (!business || !customerId) return;

    const { data: m } = await supabase
      .from("memberships")
      .select("id,bar_id,customer_id,stamps_count,updated_at")
      .eq("bar_id", business.id)
      .eq("customer_id", customerId)
      .maybeSingle();

    setMembership(
      (m as Membership) ?? {
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

    setRewards((r as Reward[]) || []);
  }

  async function addStamp() {
    if (!business || !cfg) return;
    if (!customerId) {
      router.push(`/b/${slug}/login`);
      return;
    }
    if (!pin.trim()) {
      alert(cfg.texts?.wallet?.pin_missing_add_stamp ?? "Introduce el PIN");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/stamp/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barSlug: slug, customerId, pin }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      alert((data.error || cfg.texts?.common?.error_generic) ?? "Error");
      return;
    }
    setPin("");
    await refresh();
    if (data.createdReward) {
      alert(cfg?.texts?.wallet?.stamps_completed_message ?? "¡Objetivo completado! Tienes un nuevo premio para canjear.");
    }
  }

  async function redeemReward(rewardId: string) {
    if (!business || !cfg) return;
    if (!customerId) {
      router.push(`/b/${slug}/login`);
      return;
    }
    if (!pin.trim()) {
      alert(cfg.texts?.wallet?.pin_missing_redeem ?? "Introduce el PIN");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barSlug: slug, customerId, pin, rewardId }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      alert((data.error || cfg.texts?.common?.error_generic) ?? "Error");
      return;
    }
    setPin("");
    await refresh();
  }

  const theme = useTheme();
  const StampComponent = theme.components?.Stamp ?? DefaultStampDot;
  const stampsGoal = cfg?.stamps?.goal ?? 8;
  const stamps = membership?.stamps_count ?? 0;
  const wheelEnabled = Boolean(cfg?.features?.wheel && cfg?.wheel?.enabled);
  const name = cfg?.branding?.name || business?.name || "Negocio";
  const logoUrl = cfg?.branding?.logo_url || business?.logo_url;
  const c = theme.color;
  const t = theme.tokens;

  if (!loading && !cfgLoading && !customerId) {
    router.replace(`/b/${slug}/login`);
    return null;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: t.space.lg,
        background: c.background,
        color: c.text,
        fontFamily: t.font.sans,
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: t.space.sm,
            marginBottom: t.space.lg,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: t.radius,
              overflow: "hidden",
              border: `1px solid ${c.border}`,
              background: c.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 20, color: c.primary }}>—</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: c.secondary }}>{cfg?.texts?.wallet?.title_kicker ?? "Tu wallet"}</div>
            <div style={{ fontWeight: t.font.weight.semibold, fontSize: 18 }}>{name}</div>
          </div>
          <div style={{ display: "flex", gap: t.space.xs }}>
            {wheelEnabled && (
              <Button
                style={{ width: "auto", padding: "10px 14px" }}
                onClick={() => router.push(`/b/${slug}/spin`)}
              >
                {cfg?.texts?.wallet?.cta_wheel ?? "Ruleta"}
              </Button>
            )}
            <Button variant="secondary" style={{ width: "auto", padding: "10px 14px" }} onClick={() => router.push(`/b/${slug}`)}>
              Volver
            </Button>
          </div>
        </div>

        {/* Tarjeta de puntos */}
        <Card style={{ marginBottom: t.space.lg }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: t.space.sm }}>
            <span style={{ fontSize: 15, fontWeight: t.font.weight.medium }}>
              {cfg?.texts?.wallet?.section_stamps ?? "Tus sellos"}
            </span>
            <span style={{ fontSize: 14, color: c.secondary }}>{stamps} / {stampsGoal}</span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Array.from({ length: stampsGoal }).map((_, i) => (
              <StampComponent key={i} filled={i < stamps} />
            ))}
          </div>
          <p style={{ marginTop: t.space.sm, fontSize: 13, color: c.secondary }}>
            {cfg?.texts?.wallet?.reward_for_completion ?? "Al completar:"}{" "}
            <strong>{cfg?.stamps?.reward_title ?? "Premio"}</strong>
          </p>
        </Card>

        {/* Acciones staff */}
        <Card style={{ marginBottom: t.space.lg }}>
          <div style={{ fontSize: 15, fontWeight: t.font.weight.medium, marginBottom: 4 }}>
            {cfg?.texts?.wallet?.staff_actions_title ?? "Acciones (staff)"}
          </div>
          <p style={{ fontSize: 13, color: c.secondary, marginBottom: t.space.sm }}>
            {cfg?.texts?.wallet?.staff_actions_subtitle ??
              "PIN del establecimiento para validar consumo o canjear premios."}
          </p>
          <Input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder={cfg?.texts?.wallet?.pin_placeholder ?? "PIN"}
          />
          <Button onClick={addStamp} disabled={busy} style={{ marginTop: t.space.xs }}>
            {busy ? cfg?.texts?.wallet?.processing ?? "Procesando…" : cfg?.texts?.wallet?.add_stamp ?? "Añadir 1 sello"}
          </Button>
        </Card>

        {/* Premios activos */}
        <Card>
          <div style={{ fontSize: 15, fontWeight: t.font.weight.medium, marginBottom: t.space.sm }}>
            {cfg?.texts?.wallet?.rewards_title ?? "Premios activos"}
          </div>

          {loading ? (
            <p style={{ fontSize: 14, color: c.secondary }}>{cfg?.texts?.common?.loading ?? "Cargando…"}</p>
          ) : rewards.length === 0 ? (
            <p style={{ fontSize: 14, color: c.secondary }}>{cfg?.texts?.wallet?.rewards_empty ?? "Sin premios activos."}</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: t.space.sm }}>
              {rewards.map((r) => (
                <li
                  key={r.id}
                  style={{
                    padding: t.space.md,
                    borderRadius: t.radius,
                    border: `1px solid ${c.border}`,
                    background: c.background,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: t.space.sm,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      flexShrink: 0,
                    }}
                  >
                    {theme.key === "barber" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/themes/barber/scissors.png" alt="" width={28} height={28} style={{ objectFit: "contain" }} />
                    ) : (
                      "🍺"
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: t.font.weight.semibold, fontSize: 15, color: c.text }}>
                      1× {r.title}
                    </div>
                    <div style={{ fontSize: 13, color: c.ready ?? c.text, marginTop: 2 }}>
                      ✔ {cfg?.texts?.wallet?.rewards_ready ?? "Listo para usar"}
                    </div>
                    <div style={{ fontSize: 12, color: c.secondary, marginTop: 4 }}>
                      {cfg?.texts?.wallet?.rewards_expires_at ?? "Caduca:"} {formatDate(r.expires_at)}
                    </div>
                    <Button variant="secondary" onClick={() => redeemReward(r.id)} disabled={busy} style={{ marginTop: t.space.sm }}>
                      {cfg?.texts?.wallet?.redeem ?? "Canjear (staff)"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <p style={{ marginTop: t.space.lg, fontSize: 12, color: c.secondary, textAlign: "center" }}>
          {cfg?.texts?.wallet?.tip ?? "Guarda esta página en tu pantalla de inicio para acceder como app."}
        </p>
      </div>
    </main>
  );
}
