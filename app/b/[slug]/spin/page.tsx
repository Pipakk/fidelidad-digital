"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useBusinessConfig } from "@/lib/client/useBusinessConfig";
import type { WheelSegment } from "@/lib/CONFIG_SCHEMA";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { theme } from "@/lib/theme";

/** Alternancia claro/oscuro como en mockup (texto blanco sobre segmentos) */
const CAMEL_WHEEL_COLORS = [theme.color.camelLight, theme.color.camelDark, theme.color.camelLight, theme.color.camelDark, theme.color.camelLight, theme.color.camelDark, theme.color.camelLight, theme.color.camelDark];

function buildConicGradient(labels: string[], colors: string[]) {
  const step = 360 / Math.max(1, labels.length);
  const stops: string[] = [];
  for (let i = 0; i < labels.length; i++) {
    const from = i * step;
    const to = (i + 1) * step;
    stops.push(`${colors[i % colors.length]} ${from}deg ${to}deg`);
  }
  return `conic-gradient(${stops.join(", ")})`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useWheelSounds() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  function getCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current!;
  }

  function tick() {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 720;
    g.gain.value = 0.015;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.03);
  }

  function win() {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0.025;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    o.frequency.setValueAtTime(523.25, now);
    o.frequency.setValueAtTime(659.25, now + 0.1);
    o.frequency.setValueAtTime(783.99, now + 0.2);
    o.start();
    o.stop(now + 0.35);
  }

  return { tick, win };
}

type Bar = { id: string; name: string; slug: string; logo_url: string | null };

type SpinResponse = {
  prize: string;
  segmentId?: string;
  type?: "none" | "reward" | "stamp";
  saved?: boolean;
  reward?: { id: string; title: string; expires_at?: string };
  error?: string;
};

export default function SpinPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<SpinResponse["type"]>(undefined);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [rewardId, setRewardId] = useState<string | null>(null);
  const [wheelSize, setWheelSize] = useState(320);
  const [bar, setBar] = useState<Bar | null>(null);

  const { data: cfgData } = useBusinessConfig(slug);
  const cfg = cfgData?.config;

  const { tick, win } = useWheelSounds();
  const tickIntervalRef = useRef<number | null>(null);

  const segments: WheelSegment[] = useMemo(() => {
    const raw = cfg?.wheel?.segments || [];
    const enabled = raw.filter((s) => s && s.enabled !== false);
    return enabled.length >= 4 ? enabled : raw;
  }, [cfg?.wheel?.segments]);

  const labels = useMemo(() => segments.map((s) => s.label), [segments]);
  /** Siempre paleta mockup: tonos camel alternados (claro/oscuro), texto blanco — como imagen2 */
  const colors = CAMEL_WHEEL_COLORS;

  const segmentAngle = useMemo(() => 360 / Math.max(1, labels.length), [labels.length]);
  const wheelBg = useMemo(() => buildConicGradient(labels, colors), [labels, colors]);

  useEffect(() => {
    function recalc() {
      setWheelSize(clamp(Math.floor(window.innerWidth - 48), 260, 380));
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("bars").select("id,name,slug,logo_url").eq("slug", slug).single();
      if (!error) setBar(data as Bar);
    })();
  }, [slug, supabase]);

  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current);
    };
  }, []);

  const radius = Math.round(wheelSize / 2 - wheelSize * 0.16);
  const textBoxW = Math.round(wheelSize * 0.33);
  const textBoxMaxH = Math.round(wheelSize * 0.1);
  const centerSize = Math.round(wheelSize * 0.18);
  /** Borde grueso tipo madera como en mockup */
  const rimSize = clamp(Math.round(wheelSize * 0.045), 12, 18);
  const fontSize = clamp(Math.round(wheelSize * 0.032), 10, 13);

  function fireConfetti() {
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: [theme.color.camel, theme.color.camelLight, theme.color.sand] });
  }

  async function spin() {
    if (spinning) return;

    setSpinning(true);
    setResult(null);
    setResultType(undefined);
    setSaved(null);
    setRewardId(null);

    const { data: auth } = await supabase.auth.getUser();
    const customerId = auth.user?.id;

    if (!customerId) {
      alert(cfg?.texts?.wheel?.need_login ?? "Inicia sesión para girar");
      setSpinning(false);
      router.push(`/b/${slug}/login`);
      return;
    }

    const res = await fetch("/api/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barSlug: slug, customerId }),
    });

    const data = (await res.json()) as SpinResponse;

    if (!res.ok) {
      alert((data.error || cfg?.texts?.common?.error_generic) ?? "Error");
      setSpinning(false);
      return;
    }

    const prize = data.prize as string;
    const segId = data.segmentId;
    const prizeIndex =
      (segId ? segments.findIndex((s) => s.id === segId) : -1) >= 0
        ? segments.findIndex((s) => s.id === segId)
        : labels.indexOf(prize);

    if (prizeIndex === -1) {
      setSpinning(false);
      return;
    }

    setSaved(Boolean(data.saved));
    setRewardId(data.reward?.id ?? null);

    if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current);
    tickIntervalRef.current = window.setInterval(() => tick(), 120);

    const targetAngle = 360 * 5 + (360 - prizeIndex * segmentAngle - segmentAngle / 2);
    setRotation(targetAngle);

    window.setTimeout(() => {
      if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
      setResult(prize);
      setResultType(data.type);
      if (data.type && data.type !== "none") {
        win();
        fireConfetti();
      }
      setSpinning(false);
    }, 4200);
  }

  const isWin = Boolean(result && resultType && resultType !== "none");
  const name = cfg?.branding?.name || bar?.name || "Negocio";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: theme.space.lg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: theme.color.ivory,
        color: theme.color.text,
        fontFamily: theme.font.sans,
      }}
    >
      <div style={{ width: "min(520px, 100%)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: theme.space.md,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: theme.color.camelDark }}>{cfg?.texts?.wheel?.title_kicker ?? "Ruleta"}</div>
            <div style={{ fontWeight: theme.font.weight.semibold, fontSize: 18 }}>{name}</div>
          </div>
          <Button variant="secondary" style={{ width: "auto", padding: "10px 14px" }} onClick={() => router.push(`/b/${slug}/wallet`)}>
            {cfg?.texts?.wheel?.cta_wallet ?? "Mi wallet"}
          </Button>
        </div>

        <Card style={{ padding: theme.space.xl, marginBottom: theme.space.lg }}>
          {/* Puntero triangular oscuro (estilo madera) */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${Math.round(wheelSize * 0.032)}px solid transparent`,
              borderRight: `${Math.round(wheelSize * 0.032)}px solid transparent`,
              borderTop: `${Math.round(wheelSize * 0.048)}px solid ${theme.color.wood}`,
              margin: "0 auto",
              position: "relative",
              top: 8,
              zIndex: 10,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
            }}
          />

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: wheelSize, height: wheelSize }}>
              <div
                style={{
                  width: wheelSize,
                  height: wheelSize,
                  borderRadius: "50%",
                  background: wheelBg,
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? "transform 4s cubic-bezier(0.33, 1, 0.68, 1)" : "none",
                  border: `${rimSize}px solid ${theme.color.wood}`,
                  boxSizing: "border-box",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: `0 6px 24px rgba(0,0,0,0.12)`,
                  touchAction: "manipulation",
                }}
              >
                {labels.map((label, i) => {
                  const mid = i * segmentAngle + segmentAngle / 2;
                  const needsFlip = mid > 90 && mid < 270;
                  const tangential = 90 + (needsFlip ? 180 : 0);
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 0,
                        height: 0,
                        transform: `rotate(${mid}deg) translateY(-${radius}px)`,
                        transformOrigin: "center",
                        pointerEvents: "none",
                        userSelect: "none",
                      }}
                    >
                      <div
                        style={{
                          transform: `translateX(-50%) rotate(${tangential}deg)`,
                          width: textBoxW,
                          maxWidth: textBoxW,
                          maxHeight: textBoxMaxH,
                          padding: "2px 4px",
                          boxSizing: "border-box",
                          textAlign: "center",
                          fontWeight: theme.font.weight.medium,
                          fontSize,
                          lineHeight: 1.05,
                          wordBreak: "break-word",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          color: theme.color.white,
                          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                        }}
                        title={label}
                      >
                        {label}
                      </div>
                    </div>
                  );
                })}

                {/* Centro blanco con borde dorado como en mockup */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      width: centerSize,
                      height: centerSize,
                      borderRadius: "50%",
                      background: theme.color.white,
                      border: `2px solid ${theme.color.camel}`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: theme.space.lg }}>
            <Button onClick={spin} disabled={spinning}>
              {spinning ? cfg?.texts?.wheel?.spinning ?? "Girando…" : cfg?.texts?.wheel?.cta_spin ?? "Girar ruleta"}
            </Button>

            {result && (
              <div
                style={{
                  marginTop: theme.space.md,
                  padding: theme.space.md,
                  borderRadius: 10,
                  background: theme.color.ivory,
                  border: `1px solid ${theme.color.border}`,
                }}
              >
                <div style={{ fontSize: 12, color: theme.color.camelDark }}>{cfg?.texts?.wheel?.result_title ?? "Resultado"}</div>
                <div style={{ fontSize: 17, fontWeight: theme.font.weight.semibold, marginTop: 4, color: theme.color.text }}>
                  {result}
                </div>
                {isWin && (
                  <>
                    <p style={{ fontSize: 13, color: theme.color.camelDark, marginTop: 6 }}>
                      {saved
                        ? cfg?.texts?.wheel?.saved_ok ?? "Premio guardado en tu wallet."
                        : cfg?.texts?.wheel?.saved_fail ?? "No se pudo guardar el premio."}
                    </p>
                    <Button variant="secondary" style={{ marginTop: 8 }} onClick={() => router.push(`/b/${slug}/wallet`)}>
                      {cfg?.texts?.wheel?.cta_view_reward ?? "Ver en wallet"}
                    </Button>
                  </>
                )}
              </div>
            )}

            <Button variant="secondary" style={{ marginTop: theme.space.sm }} onClick={() => router.push(`/b/${slug}`)}>
              Volver al negocio
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
