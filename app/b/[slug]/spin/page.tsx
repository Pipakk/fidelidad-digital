"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { supabaseBrowser } from "@/lib/supabaseClient";

const PRIZES = [
  "1 sello extra",
  "Sigue jugando",
  "5% dto próxima visita",
  "Sigue jugando",
  "Tapa gratis",
  "Sigue jugando",
];

const SEGMENT_COLORS = ["#f59e0b", "#fde68a", "#34d399", "#fde68a", "#f87171", "#fde68a"];
const SEGMENT_COUNT = PRIZES.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

function buildConicGradient() {
  const step = 360 / PRIZES.length;
  const stops: string[] = [];
  for (let i = 0; i < PRIZES.length; i++) {
    const from = i * step;
    const to = (i + 1) * step;
    stops.push(`${SEGMENT_COLORS[i % SEGMENT_COLORS.length]} ${from}deg ${to}deg`);
  }
  return `conic-gradient(${stops.join(", ")})`;
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
    o.frequency.value = 700;
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
    o.frequency.setValueAtTime(659.25, now + 0.10);
    o.frequency.setValueAtTime(783.99, now + 0.20);
    o.start();
    o.stop(now + 0.35);
  }

  return { tick, win };
}

// ✅ helper responsive
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function SpinPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // ✅ responsive sizes (calculados)
  const [wheelSize, setWheelSize] = useState(320);

  const { tick, win } = useWheelSounds();
  const tickIntervalRef = useRef<number | null>(null);

  const wheelBg = useMemo(() => buildConicGradient(), []);

  // 📌 Calcula el tamaño de ruleta según ancho disponible
  useEffect(() => {
    function recalc() {
      const w = window.innerWidth;
      // dejamos padding lateral y lo acotamos
      const size = clamp(Math.floor(w - 48), 260, 380);
      setWheelSize(size);
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  // Derivados del tamaño
  const radius = Math.round(wheelSize / 2 - wheelSize * 0.16); // seguro: margen interior
  const textBoxW = Math.round(wheelSize * 0.33);
  const textBoxMaxH = Math.round(wheelSize * 0.10); // ~2 líneas
  const centerSize = Math.round(wheelSize * 0.20);
  const borderSize = clamp(Math.round(wheelSize * 0.02), 4, 7);

  // fuente segura
  const fontSize = clamp(Math.round(wheelSize * 0.035), 10, 14);

  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current);
    };
  }, []);

  function fireConfetti() {
    confetti({
      particleCount: 140,
      spread: 70,
      origin: { y: 0.6 },
    });
  }

  async function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const { data: auth } = await supabase.auth.getUser();
    const customerId = auth.user?.id;
    if (!customerId) {
      alert("Necesitas iniciar sesión");
      setSpinning(false);
      router.push(`/b/${slug}/login`);
      return;
    }

    const res = await fetch("/api/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barSlug: slug, customerId }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Error");
      setSpinning(false);
      return;
    }

    const prize = data.prize as string;
    const prizeIndex = PRIZES.indexOf(prize);
    if (prizeIndex === -1) {
      alert(`Premio desconocido: ${prize}`);
      setSpinning(false);
      return;
    }

    if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current);
    tickIntervalRef.current = window.setInterval(() => tick(), 120);

    const targetAngle = 360 * 5 + (360 - prizeIndex * SEGMENT_ANGLE - SEGMENT_ANGLE / 2);
    setRotation(targetAngle);

    window.setTimeout(() => {
      if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;

      setResult(prize);

      if (prize !== "Sigue jugando") {
        win();
        fireConfetti();
      }
      setSpinning(false);
    }, 4200);
  }

  return (
    <main style={{ padding: 16, maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ marginBottom: 8 }}>🎡 Ruleta</h1>

      {/* Puntero */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${Math.round(wheelSize * 0.03)}px solid transparent`,
          borderRight: `${Math.round(wheelSize * 0.03)}px solid transparent`,
          borderTop: `${Math.round(wheelSize * 0.045)}px solid #111`,
          margin: "0 auto",
          position: "relative",
          top: 10,
          zIndex: 10,
        }}
      />

      {/* Contenedor rueda */}
      <div style={{ position: "relative", width: wheelSize, height: wheelSize, margin: "0 auto" }}>
        <div
          style={{
            width: wheelSize,
            height: wheelSize,
            borderRadius: "50%",
            background: wheelBg,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4s cubic-bezier(0.33, 1, 0.68, 1)" : "none",
            border: `${borderSize}px solid #111`,
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
            touchAction: "manipulation", // ✅ mejor en móvil
          }}
        >
          {/* Etiquetas */}
          {PRIZES.map((label, i) => {
            const mid = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
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
                    textShadow: "0 1px 0 rgba(255,255,255,0.7)",
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
                background: "#111",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: clamp(Math.round(centerSize * 0.33), 18, 26),
                boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
              }}
            >
              🎁
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <button
        onClick={spin}
        disabled={spinning}
        style={{
          marginTop: 16,
          padding: 14,
          width: "100%",
          fontSize: 16,
          touchAction: "manipulation",
        }}
      >
        {spinning ? "Girando..." : "Girar ruleta"}
      </button>

      {result && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            background: result === "Sigue jugando" ? "#f3f4f6" : "#ecfeff",
            borderRadius: 10,
            fontSize: 16,
          }}
        >
          {result === "Sigue jugando" ? "😅 " : "🎉 "}
          Te ha tocado: <strong>{result}</strong>
        </div>
      )}

      <button
        onClick={() => router.push(`/b/${slug}/wallet`)}
        style={{ marginTop: 12, padding: 10, width: "100%", opacity: 0.85, touchAction: "manipulation" }}
      >
        Volver
      </button>
    </main>
  );
}
