"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

type Bar = {
  id: string;
  name: string;
  slug: string;
  stamp_goal: number;
  reward_title: string;
  wheel_enabled: boolean;
};

export default function BarLanding() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [bar, setBar] = useState<Bar | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: barData, error } = await supabase.from("bars").select("*").eq("slug", slug).single();
      if (error) {
        alert("No se encontró el bar. Revisa el slug en Supabase.");
        setLoading(false);
        return;
      }
      setBar(barData as Bar);

      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? null);

      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <main style={{ padding: 24 }}>Cargando...</main>;
  if (!bar) return <main style={{ padding: 24 }}>Bar no encontrado</main>;

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 6 }}>{bar.name}</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Acumula sellos y gana premios. Sin apps, solo QR.
      </p>

      {!userId ? (
        <button
          onClick={() => router.push(`/b/${slug}/login`)}
          style={{ width: "100%", padding: 14, marginTop: 12, fontSize: 16 }}
        >
          Empezar (Login por SMS)
        </button>
      ) : (
        <>
          <button
            onClick={() => router.push(`/b/${slug}/wallet`)}
            style={{ width: "100%", padding: 14, marginTop: 12, fontSize: 16 }}
          >
            Ver mis sellos
          </button>

          {bar.wheel_enabled && (
            <button
              onClick={() => router.push(`/b/${slug}/spin`)}
              style={{ width: "100%", padding: 14, marginTop: 10, fontSize: 16 }}
            >
              Girar ruleta
            </button>
          )}

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              setUserId(null);
            }}
            style={{ width: "100%", padding: 12, marginTop: 18, opacity: 0.8 }}
          >
            Cerrar sesión
          </button>
        </>
      )}

      <p style={{ fontSize: 12, color: "#777", marginTop: 18 }}>
        Al continuar aceptas la política de privacidad del establecimiento.
      </p>
    </main>
  );
}
