import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/serverSupabase";
import { ConfigService } from "@/lib/config/ConfigService";
import { sha256Hex } from "@/lib/security/pin";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      rewardId?: string;
      barSlug?: string;
      pin?: string;
      staffPin?: string;
      customerId?: string;
    };

    const rewardId = body.rewardId;
    const barSlug = body.barSlug;
    const staffPin = body.staffPin || body.pin;

    if (!rewardId || !barSlug || !staffPin) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const sb = supabaseServer();
    const { business: bar, config: cfg } = await ConfigService.getConfig(barSlug);
    if (!bar) return NextResponse.json({ error: cfg.texts.api.bar_not_found }, { status: 404 });

    const pinHash = sha256Hex(staffPin);
    const { data: staff, error: staffErr } = await sb
      .from("staff_users")
      .select("id")
      .eq("bar_id", bar.id)
      .eq("pin_hash", pinHash)
      .maybeSingle();

    if (staffErr) return NextResponse.json({ error: staffErr.message }, { status: 500 });
    if (!staff) return NextResponse.json({ error: cfg.texts.api.invalid_pin }, { status: 401 });

    const { data: reward, error: rewardErr } = await sb
      .from("rewards")
      .select("id,bar_id,customer_id,status")
      .eq("id", rewardId)
      .eq("bar_id", bar.id)
      .single();

    if (rewardErr || !reward) return NextResponse.json({ error: cfg.texts.api.reward_not_found }, { status: 404 });
    if (reward.status !== "active") return NextResponse.json({ error: cfg.texts.api.reward_not_active }, { status: 409 });

    if (body.customerId && reward.customer_id !== body.customerId) {
      return NextResponse.json({ error: cfg.texts.api.reward_wrong_user }, { status: 403 });
    }

    const { error: updErr } = await sb.from("rewards").update({ status: "redeemed" }).eq("id", rewardId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
