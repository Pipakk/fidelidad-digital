"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useBusinessConfig } from "@/lib/client/useBusinessConfig";
import type { WheelSegment } from "@/lib/CONFIG_SCHEMA";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/themes/ThemeContext";

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

/** True si el color de fondo del segmento es claro (blanco/marfil) → usar texto negro */
function isSegmentLight(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.85;
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

  const theme = useTheme();
  const c = theme.color;
  const t = theme.tokens;
  const segmentColors = c.wheelSegmentColors ?? [c.primary, c.secondary, c.primary, c.secondary];

  const segments: WheelSegment[] = useMemo(() => {
    const raw = cfg?.wheel?.segments || [];
    const enabled = raw.filter((s) => s && s.enabled !== false);
    return enabled.length >= 4 ? enabled : raw;
  }, [cfg?.wheel?.segments]);

  const labels = useMemo(() => segments.map((s) => s.label), [segments]);
  const colors = useMemo(
    () => (cfg?.wheel?.ui?.segment_colors?.length ? cfg.wheel.ui.segment_colors : segmentColors),
    [cfg?.wheel?.ui?.segment_colors, segmentColors]
  );

  const segmentAngle = useMemo(() => 360 / Math.max(1, labels.length), [labels.length]);
  const wheelBg = useMemo(() => buildConicGradient(labels, colors), [labels, colors]);

  useEffect(() => {
    function recalc() {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const maxW = w - 32;
      const maxH = h - 220;
      const size = Math.min(maxW, maxH, 380);
      setWheelSize(clamp(Math.floor(size), 220, 380));
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
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: [c.primary, c.secondary, c.surface] });
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

    // Ángulo final (0..360) que deja el segmento ganador bajo la flecha
    const targetAngleMod = (360 - prizeIndex * segmentAngle - segmentAngle / 2 + 360) % 360;
    setRotation((prev) => {
      const currentMod = ((prev % 360) + 360) % 360;
      // Cuántos grados sumar (0..360) para ir de currentMod a targetAngleMod
      const delta = (targetAngleMod - currentMod + 360) % 360;
      // 5 vueltas completas + delta para que caiga exactamente en el premio
      return prev + 360 * 5 + delta;
    });

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

  const WheelPresentationComponent = theme.components?.WheelPresentation;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: t.space.lg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: c.background,
        color: c.text,
        fontFamily: t.font.sans,
      }}
    >
      <div style={{ width: "min(520px, 100%)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: t.space.md,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: c.secondary }}>{cfg?.texts?.wheel?.title_kicker ?? "Ruleta"}</div>
            <div style={{ fontWeight: t.font.weight.semibold, fontSize: 18 }}>{name}</div>
          </div>
          <Button variant="secondary" style={{ width: "auto", padding: "10px 14px" }} onClick={() => router.push(`/b/${slug}/wallet`)}>
            {cfg?.texts?.wheel?.cta_wallet ?? "Mi wallet"}
          </Button>
        </div>

        <Card style={{ padding: t.space.xl, marginBottom: t.space.lg }}>
          {WheelPresentationComponent ? (
            <>
              <WheelPresentationComponent
                segmentLabels={labels}
                segmentColors={colors}
                rotation={rotation}
                spinning={spinning}
                wheelSize={wheelSize}
                centerContent={null}
                pointerElement={null}
                rimSize={rimSize}
                fontSize={fontSize}
                businessName={name}
              />
            </>
          ) : (
            <>
              {/* Puntero: custom (ej. tijeras) o triangular por defecto */}
              {theme.components?.WheelPointer ? (
                theme.components.WheelPointer({ wheelSize })
              ) : (
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: `${Math.round(wheelSize * 0.032)}px solid transparent`,
                    borderRight: `${Math.round(wheelSize * 0.032)}px solid transparent`,
                    borderTop: `${Math.round(wheelSize * 0.048)}px solid ${c.wheelPointerColor ?? c.accent ?? c.secondary}`,
                    margin: "0 auto",
                    position: "relative",
                    top: 8,
                    zIndex: 10,
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                  }}
                />
              )}
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
                      border: `${rimSize}px solid ${c.accent ?? c.secondary}`,
                      boxSizing: "border-box",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                      touchAction: "manipulation",
                    }}
                  >
                    {labels.map((label, i) => {
                      const mid = i * segmentAngle + segmentAngle / 2;
                      const needsFlip = mid > 90 && mid < 270;
                      const tangential = 90 + (needsFlip ? 180 : 0);
                      const segmentColor = colors[i % colors.length];
                      const useBlackText = isSegmentLight(segmentColor);
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
                              fontWeight: t.font.weight.medium,
                              fontSize,
                              lineHeight: 1.05,
                              wordBreak: "break-word",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              color: useBlackText ? "#1A1A1A" : c.white,
                              textShadow: useBlackText ? "0 1px 1px rgba(255,255,255,0.5)" : "0 1px 2px rgba(0,0,0,0.2)",
                            }}
                            title={label}
                          >
                            {label}
                          </div>
                        </div>
                      );
                    })}
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
                          background: c.white,
                          border: `2px solid ${c.primary}`,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {theme.components?.WheelCenterContent?.({
                          size: centerSize,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: t.space.lg }}>
            <Button onClick={spin} disabled={spinning}>
              {spinning ? cfg?.texts?.wheel?.spinning ?? "Girando…" : cfg?.texts?.wheel?.cta_spin ?? "Girar ruleta"}
            </Button>

            {result && (
              <div
                style={{
                  marginTop: t.space.md,
                  padding: t.space.md,
                  borderRadius: 10,
                  background: c.background,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div style={{ fontSize: 12, color: c.secondary }}>{cfg?.texts?.wheel?.result_title ?? "Resultado"}</div>
                <div style={{ fontSize: 17, fontWeight: t.font.weight.semibold, marginTop: 4, color: c.text }}>
                  {result}
                </div>
                {isWin && (
                  <>
                    <p style={{ fontSize: 13, color: c.secondary, marginTop: 6 }}>
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

            <Button variant="secondary" style={{ marginTop: t.space.sm }} onClick={() => router.push(`/b/${slug}`)}>
              Volver al negocio
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
