import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/serverSupabase";
import { sha256Hex } from "@/lib/security/pin";
import { BusinessConfigSchema } from "@/lib/CONFIG_SCHEMA";
import { ConfigService } from "@/lib/config/ConfigService";

const BodySchema = z.object({
  barSlug: z.string().min(1),
  pin: z.string().min(1),
  config: z.unknown().optional(),
});

async function assertAdminPin(sb: ReturnType<typeof supabaseServer>, barId: string, pin: string) {
  const pinHash = sha256Hex(pin);
  const { data, error } = await sb
    .from("staff_users")
    .select("id,role")
    .eq("bar_id", barId)
    .eq("pin_hash", pinHash)
    .maybeSingle();

  if (error) return { ok: false as const, error: error.message };
  if (!data) return { ok: false as const, error: "Invalid PIN" };
  if (data.role !== "admin" && data.role !== "manager") return { ok: false as const, error: "Forbidden" };
  return { ok: true as const, staffId: data.id };
}

export async function POST(req: Request) {
  // Get current config (admin)
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { barSlug, pin } = parsed.data;
  const { business, config, issues } = await ConfigService.getConfig(barSlug);
  if (!business) return NextResponse.json({ error: config.texts.api.bar_not_found }, { status: 404 });

  const sb = supabaseServer();
  const auth = await assertAdminPin(sb, business.id, pin);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });

  return NextResponse.json({ business: { id: business.id, slug: business.slug, name: business.name }, config, issues });
}

export async function PUT(req: Request) {
  // Update config (admin)
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { barSlug, pin, config } = parsed.data;
  if (!config) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const { business, config: cfgForTexts } = await ConfigService.getConfig(barSlug);
  if (!business) return NextResponse.json({ error: cfgForTexts.texts.api.bar_not_found }, { status: 404 });

  const sb = supabaseServer();
  const auth = await assertAdminPin(sb, business.id, pin);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });

  // Strong runtime validation; keep safe defaults by requiring schema to parse.
  const validated = BusinessConfigSchema.safeParse(config);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: "Invalid config",
        issues: validated.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
      },
      { status: 422 }
    );
  }

  const { error: updErr } = await sb
    .from("bars")
    .update({ config: validated.data, updated_at: new Date().toISOString() })
    .eq("id", business.id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

