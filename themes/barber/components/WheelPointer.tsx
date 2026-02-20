"use client";

const SCISSORS_IMG = "/themes/barber/scissors.png";

/**
 * Puntero de la ruleta para barbería: imagen de tijeras (estilo camel, misma ruleta).
 */
export function BarberWheelPointer({ wheelSize }: { wheelSize: number }) {
  const size = Math.round(wheelSize * 0.12);
  return (
    <div
      style={{
        margin: "0 auto",
        position: "relative",
        top: 8,
        zIndex: 10,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <img
        src={SCISSORS_IMG}
        alt=""
        width={size}
        height={size}
        style={{ objectFit: "contain", transform: "rotate(-90deg)" }}
      />
    </div>
  );
}
