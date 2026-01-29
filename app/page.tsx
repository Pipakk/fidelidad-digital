import { supabaseServer } from "@/lib/serverSupabase";
import { ConfigService } from "@/lib/config/ConfigService";
import Link from "next/link";

export default async function Home() {
  const sb = supabaseServer();

  const { data: bars, error } = await sb
    .from("bars")
    .select("id,slug,name,logo_url")
    .order("created_at", { ascending: true });

  const businessesWithConfig = await Promise.all(
    (bars ?? []).map(async (bar) => {
      const { config, business } = await ConfigService.getConfig(bar.slug);
      return {
        id: bar.id,
        slug: bar.slug,
        name: config.branding.name || bar.name,
        logo_url: config.branding.logo_url || bar.logo_url,
        config,
      };
    })
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(1200px 600px at 20% 10%, rgba(255,186,73,.35), transparent 60%)," +
          "radial-gradient(900px 500px at 90% 20%, rgba(52,211,153,.30), transparent 55%)," +
          "radial-gradient(900px 500px at 30% 90%, rgba(248,113,113,.25), transparent 55%)," +
          "linear-gradient(180deg, #0b1220 0%, #0a0f1a 100%)",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "min(1200px, 100%)",
          maxWidth: "100%",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 900,
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            Loyalty MVP
          </h1>
          <p style={{ fontSize: 16, opacity: 0.85 }}>
            Selecciona un negocio para empezar
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            Error cargando negocios: {error.message}
          </div>
        )}

        {(!businessesWithConfig || businessesWithConfig.length === 0) && !error && (
          <div
            style={{
              padding: 24,
              borderRadius: 20,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              textAlign: "center",
              opacity: 0.85,
            }}
          >
            No hay negocios aún en la tabla <code>bars</code>.
          </div>
        )}

        {/* Grid de negocios */}
        {businessesWithConfig && businessesWithConfig.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
              padding: "0 8px",
            }}
          >
            {businessesWithConfig.map((business) => {
              const wheelEnabled = business.config.features.wheel && business.config.wheel.enabled;
              const stampsGoal = business.config.stamps.goal;

              return (
                <Link
                  key={business.id}
                  href={`/b/${business.slug}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      borderRadius: 20,
                      padding: 20,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
                      backdropFilter: "blur(10px)",
                      cursor: "pointer",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Logo */}
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 18,
                        overflow: "hidden",
                        background: "rgba(255,255,255,0.10)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 16,
                        flexShrink: 0,
                      }}
                    >
                      {business.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={business.logo_url}
                          alt={business.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: 32 }}>🏪</span>
                      )}
                    </div>

                    {/* Nombre */}
                    <h2
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        lineHeight: 1.2,
                        marginBottom: 12,
                        marginTop: 0,
                      }}
                    >
                      {business.name}
                    </h2>

                    {/* Info rápida */}
                    <div
                      style={{
                        borderRadius: 12,
                        padding: 12,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        display: "grid",
                        gap: 8,
                        marginTop: "auto",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                        <span style={{ opacity: 0.85 }}>Sellos objetivo</span>
                        <strong>{stampsGoal}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                        <span style={{ opacity: 0.85 }}>Ruleta</span>
                        <strong>{wheelEnabled ? "✅ Activada" : "❌ No disponible"}</strong>
                      </div>
                    </div>

                    {/* CTA */}
                    <div
                      style={{
                        marginTop: 16,
                        padding: 12,
                        borderRadius: 14,
                        fontSize: 14,
                        fontWeight: 800,
                        textAlign: "center",
                        color: "#0b1220",
                        background: "linear-gradient(90deg,#fde68a,#34d399)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                      }}
                    >
                      Entrar →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
