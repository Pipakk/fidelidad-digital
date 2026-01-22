"use client";

import { useParams } from "next/navigation";

export default function StaffPage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1>Modo Staff</h1>
      <p style={{ color: "#555" }}>
        Este MVP valida sellos y canje desde la pantalla del cliente con PIN.
      </p>
      <p style={{ color: "#555" }}>
        Bar slug: <strong>{slug}</strong>
      </p>
    </main>
  );
}
