import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/serverSupabase";
import { ConfigService } from "@/lib/config/ConfigService";
import { sha256Hex } from "@/lib/security/pin";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      barSlug?: string;
      customerId?: string;
      pin?: string;       // frontend manda pin
      staffPin?: string;  // compat
    };

    const barSlug = body.barSlug;
    const customerId = body.customerId;
    const staffPin = body.staffPin || body.pin;

    if (!barSlug || !customerId || !staffPin) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const sb = supabaseServer();
    const { business: bar, config: cfg } = await ConfigService.getConfig(barSlug);
    if (!bar) return NextResponse.json({ error: cfg.texts.api.bar_not_found }, { status: 404 });

    // 2) validar PIN staff
    const pinHash = sha256Hex(staffPin);
    const { data: staff, error: staffErr } = await sb
      .from("staff_users")
      .select("id")
      .eq("bar_id", bar.id)
      .eq("pin_hash", pinHash)
      .maybeSingle();

    if (staffErr) return NextResponse.json({ error: staffErr.message }, { status: 500 });
    if (!staff) return NextResponse.json({ error: cfg.texts.api.invalid_pin }, { status: 401 });

    // Sin límite de sellos por PIN: no se aplica límite diario.

    // 3) membership (upsert) + sumar sello
    // Primero, aseguramos que existe
    const { data: m0, error: m0Err } = await sb
      .from("memberships")
      .select("id,stamps_count")
      .eq("bar_id", bar.id)
      .eq("customer_id", customerId)
      .maybeSingle();

    if (m0Err) return NextResponse.json({ error: m0Err.message }, { status: 500 });

    const current = m0?.stamps_count ?? 0;

    if (!m0) {
      const { error: insMemErr } = await sb.from("memberships").insert({
        bar_id: bar.id,
        customer_id: customerId,
        stamps_count: 0,
      });
      if (insMemErr) return NextResponse.json({ error: insMemErr.message }, { status: 500 });
    }

    // registrar evento (auditoría)
    const { error: evErr } = await sb.from("stamp_events").insert({
      bar_id: bar.id,
      customer_id: customerId,
      staff_id: staff.id,
    });
    if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });

    // actualizar contador
    const { data: updated, error: updErr } = await sb
      .from("memberships")
      .update({ stamps_count: current + 1, updated_at: new Date().toISOString() })
      .eq("bar_id", bar.id)
      .eq("customer_id", customerId)
      .select("stamps_count")
      .single();

    if (updErr || !updated) return NextResponse.json({ error: updErr?.message || "Update failed" }, { status: 500 });

    let createdReward: any = null;

    // 4) si completa objetivo, crear reward y reset sellos
    const goal = Number(cfg.stamps.goal ?? 0);
    if (goal > 0 && updated.stamps_count >= goal) {
      const expiresDays = Number(cfg.rewards.expires_days ?? 30);
      const expires = new Date();
      expires.setDate(expires.getDate() + (Number.isFinite(expiresDays) ? expiresDays : 30));

      const title = cfg.stamps.reward_title || bar.reward_title || "Premio por sellos";

      const { data: reward, error: rErr } = await sb
        .from("rewards")
        .insert({
          bar_id: bar.id,
          customer_id: customerId,
          source: "stamps",
          title,
          status: "active",
          expires_at: expires.toISOString(),
        })
        .select("id,title,source,status,expires_at,created_at")
        .single();

      if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

      createdReward = reward;

      const { error: resetErr } = await sb
        .from("memberships")
        .update({ stamps_count: 0, updated_at: new Date().toISOString() })
        .eq("bar_id", bar.id)
        .eq("customer_id", customerId);

      if (resetErr) return NextResponse.json({ error: resetErr.message }, { status: 500 });
    }

    const finalStamps = createdReward ? 0 : updated.stamps_count;
    return NextResponse.json({ ok: true, stamps: finalStamps, createdReward });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
