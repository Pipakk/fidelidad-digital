"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { useBusinessConfig } from "@/lib/client/useBusinessConfig";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { theme } from "@/lib/theme";

export default function LoginPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const { data: cfgData } = useBusinessConfig(slug);
  const cfg = cfgData?.config;
  const business = cfgData?.business;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !password) {
      alert(cfg?.texts?.login?.validation_missing ?? "Rellena email y contraseña");
      return;
    }
    if (password.length < 6) {
      alert(cfg?.texts?.login?.validation_password_len ?? "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        alert(error.message);
        return;
      }
      if (data.user?.id) {
        await supabase.from("customers").upsert({ id: data.user.id, phone: null });
      }
      router.push(`/b/${slug}/wallet`);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    if (data.user?.id) {
      await supabase.from("customers").upsert({ id: data.user.id, phone: null });
    }
    router.push(`/b/${slug}/wallet`);
  }

  const name = cfg?.branding?.name || business?.name || "Negocio";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: theme.space.lg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.color.ivory,
        color: theme.color.text,
        fontFamily: theme.font.sans,
      }}
    >
      <div style={{ width: "min(400px, 100%)" }}>
        <h1
          style={{
            textAlign: "center",
            fontSize: 22,
            fontWeight: theme.font.weight.semibold,
            color: theme.color.text,
            marginBottom: theme.space.xs,
          }}
        >
          {cfg?.texts?.login?.title_kicker ?? "Acceso"}
        </h1>
        <p style={{ textAlign: "center", fontSize: 14, color: theme.color.camelDark, marginBottom: theme.space.lg }}>
          {name}
        </p>

        <Card>
          <div
            style={{
              display: "flex",
              gap: theme.space.xs,
              marginBottom: theme.space.md,
              padding: 4,
              borderRadius: 10,
              background: theme.color.ivory,
              border: `1px solid ${theme.color.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => setMode("signup")}
              style={{
                flex: 1,
                padding: theme.space.sm,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: theme.font.weight.medium,
                background: mode === "signup" ? theme.color.white : "transparent",
                color: mode === "signup" ? theme.color.text : theme.color.camelDark,
                boxShadow: mode === "signup" ? `0 1px 3px ${theme.color.shadow}` : "none",
              }}
            >
              {cfg?.texts?.login?.tab_signup ?? "Crear cuenta"}
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              style={{
                flex: 1,
                padding: theme.space.sm,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: theme.font.weight.medium,
                background: mode === "login" ? theme.color.white : "transparent",
                color: mode === "login" ? theme.color.text : theme.color.camelDark,
                boxShadow: mode === "login" ? `0 1px 3px ${theme.color.shadow}` : "none",
              }}
            >
              {cfg?.texts?.login?.tab_login ?? "Entrar"}
            </button>
          </div>

          <Input
            label={cfg?.texts?.login?.email_label ?? "Email"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={cfg?.texts?.login?.email_placeholder ?? "tu@email.com"}
            autoComplete="email"
          />
          <Input
            label={cfg?.texts?.login?.password_label ?? "Contraseña"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={cfg?.texts?.login?.password_placeholder ?? "********"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />

          <div style={{ marginTop: theme.space.md }}>
            <Button onClick={submit} disabled={loading}>
              {loading
                ? cfg?.texts?.login?.processing ?? "Procesando…"
                : mode === "signup"
                  ? cfg?.texts?.login?.submit_signup ?? "Crear cuenta"
                  : cfg?.texts?.login?.submit_login ?? "Entrar"}
            </Button>
          </div>

          <div style={{ marginTop: theme.space.sm }}>
            <Button variant="secondary" onClick={() => router.push(`/b/${slug}`)}>
              Volver
            </Button>
          </div>

          <p style={{ marginTop: theme.space.md, fontSize: 11, color: theme.color.camelDark, lineHeight: 1.4 }}>
            {cfg?.texts?.login?.hint_line_1 ?? "Acceso con email y contraseña."}
            <br />
            {cfg?.texts?.login?.hint_line_2 ?? "Usa una contraseña de 8+ caracteres."}
          </p>
        </Card>
      </div>
    </main>
  );
}
