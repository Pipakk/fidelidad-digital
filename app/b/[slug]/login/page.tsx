"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { useBusinessConfig } from "@/lib/client/useBusinessConfig";

type Bar = { id: string; name: string; slug: string; logo_url: string | null };

export default function LoginPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [bar, setBar] = useState<Bar | null>(null);
  const { data: cfgData } = useBusinessConfig(slug);
  const cfg = cfgData?.config;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("bars")
        .select("id,name,slug,logo_url")
        .eq("slug", slug)
        .single();
      if (!error) setBar(data as Bar);
    })();
  }, [slug]);

  async function submit() {
    if (!email || !password) return alert(cfg?.texts.login.validation_missing ?? "Rellena email y contraseña");
    if (password.length < 6) return alert(cfg?.texts.login.validation_password_len ?? "La contraseña debe tener al menos 6 caracteres");

    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) return alert(error.message);

      if (data.user?.id) {
        await supabase.from("customers").upsert({ id: data.user.id, phone: null });
      }

      router.push(`/b/${slug}/wallet`);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return alert(error.message);

    if (data.user?.id) {
      await supabase.from("customers").upsert({ id: data.user.id, phone: null });
    }

    router.push(`/b/${slug}/wallet`);
  }

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
          width: "min(520px, 100%)",
          borderRadius: 20,
          padding: 18,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Header bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
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
              <span style={{ fontSize: 26 }}>🍻</span>
            )}
          </div>

          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: 0.4 }}>{cfg?.texts.login.title_kicker ?? "Acceso"}</div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15 }}>
              {cfg?.branding.name || bar?.name || "Tu bar"}
            </div>
            <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>
              {cfg?.texts.login.subtitle ?? "Guarda tu wallet y canjea premios."}
            </div>
          </div>
        </div>

        {/* Mode switch */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            padding: 6,
            borderRadius: 14,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <button
            onClick={() => setMode("signup")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              fontWeight: 800,
              color: mode === "signup" ? "#0b1220" : "#fff",
              background: mode === "signup" ? "linear-gradient(90deg,#fde68a,#34d399)" : "transparent",
              opacity: mode === "signup" ? 1 : 0.85,
            }}
          >
            {cfg?.texts.login.tab_signup ?? "Crear cuenta"}
          </button>

          <button
            onClick={() => setMode("login")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              fontWeight: 800,
              color: mode === "login" ? "#0b1220" : "#fff",
              background: mode === "login" ? "linear-gradient(90deg,#fde68a,#34d399)" : "transparent",
              opacity: mode === "login" ? 1 : 0.85,
            }}
          >
            {cfg?.texts.login.tab_login ?? "Entrar"}
          </button>
        </div>

        {/* Form */}
        <div
          style={{
            borderRadius: 16,
            padding: 14,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <label style={{ display: "block", fontSize: 13, opacity: 0.9, marginBottom: 6 }}>
            {cfg?.texts.login.email_label ?? "Email"}
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={cfg?.texts.login.email_placeholder ?? "tu@email.com"}
            autoComplete="email"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(0,0,0,0.25)",
              color: "#fff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <label style={{ display: "block", fontSize: 13, opacity: 0.9, margin: "12px 0 6px" }}>
            {cfg?.texts.login.password_label ?? "Contraseña"}
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder={cfg?.texts.login.password_placeholder ?? "********"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(0,0,0,0.25)",
              color: "#fff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 12,
              padding: 13,
              borderRadius: 14,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 900,
              fontSize: 16,
              color: "#0b1220",
              background: loading
                ? "linear-gradient(90deg, rgba(255,255,255,0.45), rgba(255,255,255,0.35))"
                : "linear-gradient(90deg,#fde68a,#34d399)",
              boxShadow: loading ? "none" : "0 14px 30px rgba(0,0,0,0.35)",
              touchAction: "manipulation",
            }}
          >
            {loading
              ? cfg?.texts.login.processing ?? "Procesando..."
              : mode === "signup"
                ? cfg?.texts.login.submit_signup ?? "Crear cuenta"
                : cfg?.texts.login.submit_login ?? "Entrar"}
          </button>

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
              fontWeight: 800,
              touchAction: "manipulation",
            }}
          >
            Volver
          </button>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75, lineHeight: 1.3 }}>
            {cfg?.texts.login.hint_line_1 ?? "MVP sin SMS: acceso con email y contraseña."}
            <br />
            {cfg?.texts.login.hint_line_2 ?? "Consejo: usa una contraseña de 8+ caracteres."}
          </div>
        </div>
      </div>
    </main>
  );
}
