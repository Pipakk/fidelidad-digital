"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !password) return alert("Rellena email y contraseña");

    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) return alert(error.message);

      // (Opcional) guardar extra info en tabla customers
      if (data.user?.id) {
        await supabase.from("customers").upsert({ id: data.user.id, phone: null });
      }

      router.push(`/b/${slug}/wallet`);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return alert(error.message);

    // (Opcional) asegurar customers existe
    if (data.user?.id) {
      await supabase.from("customers").upsert({ id: data.user.id, phone: null });
    }

    router.push(`/b/${slug}/wallet`);
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Acceso</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setMode("signup")}
          style={{ flex: 1, padding: 10, opacity: mode === "signup" ? 1 : 0.6 }}
        >
          Crear cuenta
        </button>
        <button
          onClick={() => setMode("login")}
          style={{ flex: 1, padding: 10, opacity: mode === "login" ? 1 : 0.6 }}
        >
          Entrar
        </button>
      </div>

      <p style={{ marginBottom: 6 }}>Email</p>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        style={{ width: "100%", padding: 10 }}
      />

      <p style={{ margin: "12px 0 6px" }}>Contraseña</p>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="********"
        style={{ width: "100%", padding: 10 }}
      />

      <button
        onClick={submit}
        disabled={loading}
        style={{ width: "100%", padding: 12, marginTop: 14 }}
      >
        {loading ? "Procesando..." : mode === "signup" ? "Crear cuenta" : "Entrar"}
      </button>

      <button
        onClick={() => router.push(`/b/${slug}`)}
        style={{ width: "100%", padding: 10, marginTop: 12, opacity: 0.8 }}
      >
        Volver
      </button>

      <p style={{ fontSize: 12, color: "#777", marginTop: 16 }}>
        MVP sin SMS: acceso con email y contraseña.
      </p>
    </div>
  );
}
