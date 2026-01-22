"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

type Bar = {
  id: string;
  name: string;
  slug: string;
  stamp_goal: number;
  reward_title: string;
};

type Reward = {
  id: string;
  title: string;
  status: "active" | "redeemed" | "expired";
  expires_at: string | null;
  source: "stamps" | "wheel";
};

export default function WalletPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [bar, setBar] = useState<Bar | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [stamps, setStamps] = useState<number>(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [staffPin, setStaffPin] = useState("");
  const [loading, setLoading] = useState(true);

  const dots = useMemo(() => {
    if (!bar) return "";
    const total = bar.stamp_goal;
    const filled = Math.min(stamps, total);
    return "●".repeat(filled) + "○".repeat(total - filled);
  }, [bar, stamps]);

  async function load() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);

    if (!uid) {
      router.push(`/b/${slug}/login`);
      return;
    }

    const { data: barData, error: barErr } = await supabase.from("bars").select("*").eq("slug", slug).single();
    if (barErr) {
      alert(barErr.message);
      setLoading(false);
      return;
    }
    setBar(barData as Bar);

    const { data: membership } = await supabase
      .from("memberships")
      .select("*")
      .eq("bar_id", (barData as any).id)
      .eq("customer_id", uid)
      .maybeSingle();

    setStamps(membership?.stamps_count ?? 0);

    const { data: rws } = await supabase
      .from("rewards")
      .select("*")
      .eq("bar_id", (barData as any).id)
      .eq("customer_id", uid)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    setRewards((rws ?? []) as Reward[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [slug]);

  async function addStamp() {
    if (!bar || !userId) return;
    const res = await fetch("/api/stamp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barSlug: bar.slug, customerId: userId, staffPin }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "Error");
    alert(json.createdReward ? "¡Premio conseguido!" : "Sello añadido");
    setStaffPin("");
    await load();
  }

  if (loading) return <main style={{ padding: 24 }}>Cargando...</main>;
  if (!bar) return <main style={{ padding: 24 }}>Bar no encontrado</main>;

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1>{bar.name}</h1>
      <p style={{ color: "#555" }}>Tus sellos</p>

      <div style={{ fontSize: 28, letterSpacing: 2, marginBottom: 8 }}>{dots}</div>
      <div style={{ color: "#555" }}>
        {stamps}/{bar.stamp_goal} · Premio: <strong>{bar.reward_title}</strong>
      </div>

      <div style={{ borderTop: "1px solid #eee", marginTop: 18, paddingTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>Añadir sello (staff)</h2>
        <p style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
          El camarero introduce el PIN del bar para validar la consumición.
        </p>
        <input
          value={staffPin}
          onChange={(e) => setStaffPin(e.target.value)}
          placeholder="PIN (ej. 1234)"
          style={{ width: "100%", padding: 10, marginTop: 8 }}
        />
        <button onClick={addStamp} style={{ width: "100%", padding: 12, marginTop: 10 }}>
          Añadir 1 sello
        </button>
      </div>

      <div style={{ borderTop: "1px solid #eee", marginTop: 18, paddingTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>Premios activos</h2>
        {rewards.length === 0 ? (
          <p style={{ color: "#666" }}>No tienes premios activos.</p>
        ) : (
          rewards.map((r) => (
            <div key={r.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginTop: 10 }}>
              <div><strong>{r.title}</strong> <span style={{ color: "#777" }}>({r.source})</span></div>
              <div style={{ fontSize: 12, color: "#777" }}>
                Caduca: {r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "—"}
              </div>
              <button
                onClick={async () => {
                  const pin = prompt("PIN staff para canjear:");
                  if (!pin) return;
                  const res = await fetch("/api/redeem", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ rewardId: r.id, barSlug: bar.slug, staffPin: pin }),
                  });
                  const json = await res.json();
                  if (!res.ok) return alert(json.error || "Error");
                  alert("Premio canjeado ✅");
                  await load();
                }}
                style={{ width: "100%", padding: 10, marginTop: 10 }}
              >
                Canjear (staff)
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={() => router.push(`/b/${slug}`)} style={{ flex: 1, padding: 12, opacity: 0.9 }}>
          Volver
        </button>
        <button onClick={() => router.push(`/b/${slug}/spin`)} style={{ flex: 1, padding: 12 }}>
          Ruleta
        </button>
      </div>
    </main>
  );
}
