"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useBusinessConfig } from "@/lib/client/useBusinessConfig";
import type { WheelSegment } from "@/lib/CONFIG_SCHEMA";

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

// ---- SONIDO (sin archivos) ----
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
    g.gain.value = 0.02;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.03);
  }

  function win() {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    g.gain.value = 0.03;
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
  const colors = useMemo(() => {
    const c = cfg?.wheel?.ui?.segment_colors;
    return c && c.length >= 2 ? c : ["#f59e0b", "#fde68a", "#34d399", "#fde68a", "#f87171", "#fde68a"];
  }, [cfg?.wheel?.ui?.segment_colors]);

  const segmentAngle = useMemo(() => 360 / Math.max(1, labels.length), [labels.length]);
  const wheelBg = useMemo(() => buildConicGradient(labels, colors), [labels, colors]);

  // Responsive wheel size
  useEffect(() => {
    function recalc() {
      const w = window.innerWidth;
      setWheelSize(clamp(Math.floor(w - 48), 260, 380));
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  // Load bar info (name/logo)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("bars").select("id,name,slug,logo_url").eq("slug", slug).single();
      if (!error) setBar(data as Bar);
    })();
  }, [slug]);

  // Derived sizes
  const radius = Math.round(wheelSize / 2 - wheelSize * 0.16);
  const textBoxW = Math.round(wheelSize * 0.33);
  const textBoxMaxH = Math.round(wheelSize * 0.1);
  const centerSize = Math.round(wheelSize * 0.2);
  const borderSize = clamp(Math.round(wheelSize * 0.02), 4, 7);
  const fontSize = clamp(Math.round(wheelSize * 0.035), 10, 14);

  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current);
    };
  }, []);

  function fireConfetti() {
    confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
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
      alert(cfg?.texts.wheel.need_login ?? "Necesitas iniciar sesión");
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
      alert(data.error || cfg?.texts.common.error_generic || "Error");
      setSpinning(false);
      return;
    }

    const prize = data.prize as string;
    const segId = data.segmentId;
    const prizeIndex =
      (segId ? segments.findIndex((s) => s.id === segId) : -1) >= 0
        ? (segments.findIndex((s) => s.id === segId) as number)
        : labels.indexOf(prize);

    if (prizeIndex === -1) {
      alert(`Premio desconocido: ${prize}`);
      setSpinning(false);
      return;
    }

    // guardar flags (para UI)
    setSaved(Boolean(data.saved));
    setRewardId(data.reward?.id ?? null);

    // ticks mientras gira
    if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current);
    tickIntervalRef.current = window.setInterval(() => tick(), 120);

    // rotación al centro del segmento bajo flecha superior
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
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
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
              <span style={{ fontSize: 22 }}>🍻</span>
            )}
          </div>

          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: 0.4 }}>
              {cfg?.texts.wheel.title_kicker ?? "Ruleta de premios"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.15 }}>{cfg?.branding.name || bar?.name || "Tu bar"}</div>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={() => router.push(`/b/${slug}/wallet`)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {cfg?.texts.wheel.cta_wallet ?? "Mis premios"}
            </button>
          </div>
        </div>

        {/* Puntero */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${Math.round(wheelSize * 0.03)}px solid transparent`,
            borderRight: `${Math.round(wheelSize * 0.03)}px solid transparent`,
            borderTop: `${Math.round(wheelSize * 0.045)}px solid rgba(255,255,255,0.95)`,
            margin: "0 auto",
            position: "relative",
            top: 10,
            zIndex: 10,
            filter: "drop-shadow(0 10px 14px rgba(0,0,0,.35))",
          }}
        />

        {/* Wheel */}
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
                border: `${borderSize}px solid rgba(255,255,255,0.9)`,
                boxSizing: "border-box",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 22px 60px rgba(0,0,0,0.55)",
                touchAction: "manipulation",
              }}
            >
              {/* Etiquetas */}
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
                        fontWeight: 800,
                        fontSize,
                        lineHeight: 1.05,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "#111",
                        textShadow: "0 1px 0 rgba(255,255,255,0.65)",
                      }}
                      title={label}
                    >
                      {label}
                    </div>
                  </div>
                );
              })}

              {/* Centro */}
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
                    background: "rgba(0,0,0,0.75)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: clamp(Math.round(centerSize * 0.33), 18, 26),
                    boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
                  }}
                >
                  🎁
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA + Result */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={spin}
            disabled={spinning}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 800,
              color: "#0b1220",
              background: spinning
                ? "linear-gradient(90deg, rgba(255,255,255,0.45), rgba(255,255,255,0.35))"
                : "linear-gradient(90deg, #fde68a, #34d399)",
              border: "none",
              cursor: spinning ? "not-allowed" : "pointer",
              boxShadow: spinning ? "none" : "0 14px 30px rgba(0,0,0,0.35)",
              touchAction: "manipulation",
            }}
          >
            {spinning ? cfg?.texts.wheel.spinning ?? "Girando..." : cfg?.texts.wheel.cta_spin ?? "Girar ruleta"}
          </button>

          {result && (
            <div
              style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 14,
                background: isWin ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.85 }}>{cfg?.texts.wheel.result_title ?? "Resultado"}</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>
                {isWin ? "🎉 " : "😅 "}
                {result}
              </div>

              {isWin && (
                <div style={{ fontSize: 13, opacity: 0.88, marginTop: 6 }}>
                  {saved ? (
                    <>
                      {cfg?.texts.wheel.saved_ok ?? "✅ Premio guardado en tu wallet."} (ID: {rewardId?.slice(0, 8) ?? "—"})
                    </>
                  ) : (
                    <>{cfg?.texts.wheel.saved_fail ?? "⚠️ No se ha podido guardar el premio. (revisa /api/spin)"}</>
                  )}
                </div>
              )}

              {isWin && (
                <button
                  onClick={() => router.push(`/b/${slug}/wallet`)}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  {cfg?.texts.wheel.cta_view_reward ?? "Ver mi premio en Wallet"}
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => router.push(`/b/${slug}`)}
            style={{
              width: "100%",
              marginTop: 10,
              padding: 12,
              borderRadius: 14,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Volver al bar
          </button>
        </div>
      </div>
    </main>
  );
}
