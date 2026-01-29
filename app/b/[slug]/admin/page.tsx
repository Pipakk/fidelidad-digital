"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { BusinessConfig } from "@/lib/CONFIG_SCHEMA";
import { BusinessConfigSchema } from "@/lib/CONFIG_SCHEMA";

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
    } catch (e: any) {
      setMessage(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!pin.trim()) return alert("Introduce el PIN admin");
    if (!configText.trim()) return alert("No hay config para guardar");

    let json: any;
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
    } catch (e: any) {
      setMessage(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #0b1220 0%, #0a0f1a 100%)",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "min(920px, 100%)",
          borderRadius: 20,
          padding: 18,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: 0.4 }}>Admin · Config negocio</div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.15 }}>/{slug}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => router.push(`/b/${slug}`)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Volver
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div
            style={{
              borderRadius: 16,
              padding: 14,
              background: "rgba(0,0,0,0.22)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 900 }}>Acceso</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
              Requiere PIN con rol <code>admin</code> o <code>manager</code> en <code>staff_users</code>.
            </div>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN admin"
              style={{
                width: "100%",
                marginTop: 10,
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(0,0,0,0.25)",
                color: "#fff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={loadConfig}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 14,
                  fontWeight: 900,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  color: "#0b1220",
                  background: loading
                    ? "linear-gradient(90deg, rgba(255,255,255,0.45), rgba(255,255,255,0.35))"
                    : "linear-gradient(90deg,#fde68a,#34d399)",
                }}
              >
                Cargar
              </button>
              <button
                onClick={saveConfig}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 14,
                  fontWeight: 900,
                  border: "1px solid rgba(255,255,255,0.14)",
                  cursor: loading ? "not-allowed" : "pointer",
                  color: "#fff",
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                Guardar
              </button>
            </div>
            {message && <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>{message}</div>}
          </div>

          <div
            style={{
              borderRadius: 16,
              padding: 14,
              background: "rgba(0,0,0,0.22)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 900 }}>Validación</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
              Estado:{" "}
              {configText.trim()
                ? parsed
                  ? BusinessConfigSchema.safeParse(parsed).success
                    ? "✅ OK"
                    : "❌ inválido"
                  : "❌ JSON inválido"
                : "—"}
            </div>
            {issues.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.95 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Errores</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {issues.slice(0, 12).map((e, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>
                      <code>{e}</code>
                    </li>
                  ))}
                </ul>
                {issues.length > 12 && <div style={{ marginTop: 6, opacity: 0.85 }}>… y {issues.length - 12} más</div>}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 8 }}>Editor JSON (avanzado)</div>
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            placeholder="{\n  \"version\": 1,\n  ...\n}"
            spellCheck={false}
            style={{
              width: "100%",
              minHeight: 520,
              resize: "vertical",
              padding: 12,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(0,0,0,0.25)",
              color: "#fff",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 12,
              lineHeight: 1.45,
            }}
          />
        </div>
      </div>
    </main>
  );
}

