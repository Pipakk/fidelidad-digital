"use client";

const SCISSORS_IMG = "/themes/barber/scissors.png";

/**
 * Centro de la ruleta barbería: PNG de tijeras (sin nombre del negocio).
 */
export function BarberWheelCenter({ size }: { size: number }) {
  const imgSize = Math.round(size * 0.6);
  return (
    <img
      src={SCISSORS_IMG}
      alt=""
      width={imgSize}
      height={imgSize}
      style={{ objectFit: "contain" }}
    />
  );
}
