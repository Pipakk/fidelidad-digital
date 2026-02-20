"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { BusinessConfig } from "@/lib/CONFIG_SCHEMA";
import { BusinessConfigSchema } from "@/lib/CONFIG_SCHEMA";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { theme } from "@/lib/theme";

function prettyJson(v: unknown) {
  return JSON.stringify(v, null, 2);
}

export default function AdminConfigPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [configText, setConfigText] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!configText.trim()) return null;
    try {
      return JSON.parse(configText) as BusinessConfig;
    } catch {
      return null;
    }
  }, [configText]);

  async function loadConfig() {
    if (!pin.trim()) return alert("Introduce el PIN admin");
    setLoading(true);
    setMessage(null);
    setIssues([]);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barSlug: slug, pin }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error");
      setConfigText(prettyJson(json.config));
      setIssues((json.issues as string[]) || []);
      setMessage("Config cargada");
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!pin.trim()) return alert("Introduce el PIN admin");
    if (!configText.trim()) return alert("No hay config para guardar");

    let json: unknown;
    try {
      json = JSON.parse(configText);
    } catch {
      return alert("JSON inválido");
    }

    const validated = BusinessConfigSchema.safeParse(json);
    if (!validated.success) {
      const errs = validated.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
      setIssues(errs);
      return alert("Config inválida (ver errores)");
    }

    setLoading(true);
    setMessage(null);
    setIssues([]);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barSlug: slug, pin, config: validated.data }),
      });
      const out = await res.json();
      if (!res.ok) {
        setIssues((out?.issues as string[]) || []);
        throw new Error(out?.error || "Error");
      }
      setMessage("Config guardada");
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: theme.space.lg,
        background: theme.color.ivory,
        color: theme.color.text,
        fontFamily: theme.font.sans,
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.space.lg }}>
          <div>
            <div style={{ fontSize: 12, color: theme.color.camelDark }}>Admin · Config negocio</div>
            <div style={{ fontSize: 20, fontWeight: theme.font.weight.semibold }}>/{slug}</div>
          </div>
          <Button variant="secondary" style={{ width: "auto", padding: "10px 14px" }} onClick={() => router.push(`/b/${slug}`)}>
            Volver
          </Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.space.md }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: theme.font.weight.medium, marginBottom: 4 }}>Acceso</div>
            <p style={{ fontSize: 12, color: theme.color.camelDark, marginBottom: theme.space.sm }}>
              PIN con rol <code>admin</code> o <code>manager</code> en <code>staff_users</code>.
            </p>
            <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN admin" />
            <div style={{ display: "flex", gap: theme.space.xs, marginTop: theme.space.sm }}>
              <Button onClick={loadConfig} disabled={loading} style={{ flex: 1 }}>
                Cargar
              </Button>
              <Button variant="secondary" onClick={saveConfig} disabled={loading} style={{ flex: 1 }}>
                Guardar
              </Button>
            </div>
            {message && <p style={{ marginTop: theme.space.sm, fontSize: 13, color: theme.color.camelDark }}>{message}</p>}
          </Card>

          <Card>
            <div style={{ fontSize: 14, fontWeight: theme.font.weight.medium, marginBottom: 4 }}>Validación</div>
            <p style={{ fontSize: 13, color: theme.color.camelDark }}>
              {configText.trim()
                ? parsed
                  ? BusinessConfigSchema.safeParse(parsed).success
                    ? "✅ OK"
                    : "❌ Inválido"
                  : "❌ JSON inválido"
                : "—"}
            </p>
            {issues.length > 0 && (
              <ul style={{ marginTop: theme.space.sm, paddingLeft: 18, fontSize: 12, color: theme.color.text }}>
                {issues.slice(0, 12).map((e, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    <code>{e}</code>
                  </li>
                ))}
                {issues.length > 12 && <li>… y {issues.length - 12} más</li>}
              </ul>
            )}
          </Card>
        </div>

        <Card style={{ marginTop: theme.space.md }}>
          <div style={{ fontSize: 14, fontWeight: theme.font.weight.medium, marginBottom: theme.space.sm }}>Editor JSON</div>
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            placeholder='{"version": 1, ...}'
            spellCheck={false}
            style={{
              width: "100%",
              minHeight: 480,
              resize: "vertical",
              padding: theme.space.sm,
              borderRadius: theme.radius,
              border: `1px solid ${theme.color.border}`,
              background: theme.color.white,
              color: theme.color.text,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "ui-monospace, monospace",
              fontSize: 12,
              lineHeight: 1.45,
            }}
          />
        </Card>
      </div>
    </main>
  );
}
