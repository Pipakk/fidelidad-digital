"use client";

import type { WheelPresentationProps } from "../../base/types";
import { barberPalette } from "../palette";

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

/**
 * Barbería: base estática, tijeras fijas arriba indicando premio, rueda gira debajo,
 * centro fijo con nombre del negocio. Sin emoji, animación suave.
 */
export function BarberWheelPresentation({
  segmentLabels,
  segmentColors,
  rotation,
  spinning,
  wheelSize,
  rimSize,
  fontSize,
  businessName,
}: WheelPresentationProps) {
  const radius = Math.round(wheelSize / 2 - wheelSize * 0.16);
  const textBoxW = Math.round(wheelSize * 0.33);
  const textBoxMaxH = Math.round(wheelSize * 0.1);
  const centerSize = Math.round(wheelSize * 0.18);
  const segmentAngle = 360 / Math.max(1, segmentLabels.length);
  const wheelBg = buildConicGradient(segmentLabels, segmentColors);

  return (
    <div style={{ position: "relative", width: wheelSize, margin: "0 auto" }}>
      {/* Tijeras fijas arriba (indican el premio) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: -4,
          transform: "translateX(-50%)",
          zIndex: 20,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        }}
      >
        <svg
          width={Math.round(wheelSize * 0.14)}
          height={Math.round(wheelSize * 0.1)}
          viewBox="0 0 32 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 2a3 3 0 0 1 3 3v2l6 5 6-5V5a3 3 0 0 1 3-3"
            stroke={barberPalette.primary}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M24 22a3 3 0 0 1-3-3v-2l-6-5-6 5v2a3 3 0 0 1-3 3"
            stroke={barberPalette.secondary}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M16 9v6" stroke={barberPalette.text} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="11" cy="5" r="2.5" stroke={barberPalette.primary} strokeWidth="1.5" fill="none" />
          <circle cx="21" cy="19" r="2.5" stroke={barberPalette.secondary} strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      {/* Rueda giratoria */}
      <div style={{ position: "relative", width: wheelSize, height: wheelSize }}>
        <div
          style={{
            width: wheelSize,
            height: wheelSize,
            borderRadius: "50%",
            background: wheelBg,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4s cubic-bezier(0.33, 1, 0.68, 1)" : "none",
            border: `${rimSize}px solid ${barberPalette.accent ?? barberPalette.secondary}`,
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
            touchAction: "manipulation",
          }}
        >
          {segmentLabels.map((label, i) => {
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
                    fontWeight: 600,
                    fontSize,
                    lineHeight: 1.05,
                    wordBreak: "break-word",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: barberPalette.white,
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  }}
                  title={label}
                >
                  {label}
                </div>
              </div>
            );
          })}

          {/* Centro fijo: eje con nombre del negocio */}
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
                background: barberPalette.white,
                border: `2px solid ${barberPalette.secondary}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
                boxSizing: "border-box",
              }}
            >
              {businessName ? (
                <span
                  style={{
                    fontSize: Math.max(8, Math.round(centerSize * 0.28)),
                    fontWeight: 600,
                    color: barberPalette.secondary,
                    textAlign: "center",
                    lineHeight: 1.1,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {businessName}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
