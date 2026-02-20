import { supabaseServer } from "@/lib/serverSupabase";
import Link from "next/link";
import { theme } from "@/lib/theme";

export default async function Home() {
  const sb = supabaseServer();
  const { data: bars } = await sb
    .from("bars")
    .select("id,slug,name,logo_url")
    .order("created_at", { ascending: true });

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: theme.space.xl,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: theme.color.ivory,
        color: theme.color.text,
        fontFamily: theme.font.sans,
      }}
    >
      <div style={{ width: "min(480px, 100%)", textAlign: "center" }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: theme.font.weight.semibold,
            color: theme.color.textSoft,
            marginBottom: theme.space.xs,
            letterSpacing: "0.02em",
          }}
        >
          Elegir negocio
        </h1>
        <p style={{ fontSize: 14, color: theme.color.camelDark, marginBottom: theme.space.lg }}>
          Accede al programa de fidelización del establecimiento.
        </p>

        {!bars?.length ? (
          <div
            style={{
              padding: theme.space.lg,
              borderRadius: theme.radius,
              border: `1px solid ${theme.color.border}`,
              background: theme.color.white,
              color: theme.color.text,
              fontSize: 14,
            }}
          >
            No hay negocios disponibles.
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: theme.space.sm }}>
            {bars.map((bar) => (
              <li key={bar.id}>
                <Link
                  href={`/b/${bar.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: theme.space.sm,
                    padding: theme.space.md,
                    borderRadius: theme.radius,
                    border: `1px solid ${theme.color.border}`,
                    background: theme.color.white,
                    color: theme.color.text,
                    textDecoration: "none",
                    boxShadow: `0 2px 12px ${theme.color.shadow}`,
                    transition: "border-color 0.15s",
                  }}
                >
                  {bar.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bar.logo_url}
                      alt=""
                      style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: theme.color.sand,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        color: theme.color.camelDark,
                      }}
                    >
                      —
                    </div>
                  )}
                  <span style={{ fontWeight: theme.font.weight.medium, fontSize: 16 }}>{bar.name}</span>
                  <span style={{ marginLeft: "auto", fontSize: 14, color: theme.color.camelDark }}>Entrar →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
