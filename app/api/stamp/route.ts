import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/serverSupabase";
import crypto from "crypto";

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json();
  const { barSlug, customerId, staffPin } = body as { barSlug: string; customerId: string; staffPin: string };

  if (!barSlug || !customerId || !staffPin) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const sb = supabaseServer();

  const { data: bar, error: barErr } = await sb.from("bars").select("*").eq("slug", barSlug).single();
  if (barErr || !bar) return NextResponse.json({ error: "Bar not found" }, { status: 404 });

  const pinHash = sha256(staffPin);
  const { data: staff } = await sb
    .from("staff_users")
    .select("id")
    .eq("bar_id", bar.id)
    .eq("pin_hash", pinHash)
    .maybeSingle();

  if (!staff) return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const { count } = await sb
    .from("stamp_events")
    .select("*", { count: "exact", head: true })
    .eq("bar_id", bar.id)
    .eq("customer_id", customerId)
    .gte("created_at", since.toISOString());

  if ((count ?? 0) >= bar.stamp_daily_limit) {
    return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });
  }

  const { data: membership } = await sb
    .from("memberships")
    .select("*")
    .eq("bar_id", bar.id)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!membership) {
    await sb.from("memberships").insert({ bar_id: bar.id, customer_id: customerId, stamps_count: 0 });
  }

  await sb.from("stamp_events").insert({ bar_id: bar.id, customer_id: customerId, staff_id: staff.id });

  const currentStamps = membership?.stamps_count ?? 0;

  const { data: updated, error: updErr } = await sb
    .from("memberships")
    .update({ stamps_count: currentStamps + 1, updated_at: new Date().toISOString() })
    .eq("bar_id", bar.id)
    .eq("customer_id", customerId)
    .select("*")
    .single();

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  let createdReward = null;

  if (updated.stamps_count >= bar.stamp_goal) {
    const expires = new Date();
    expires.setDate(expires.getDate() + bar.reward_expires_days);

    const { data: reward } = await sb
      .from("rewards")
      .insert({ bar_id: bar.id, customer_id: customerId, source: "stamps", title: bar.reward_title, expires_at: expires.toISOString() })
      .select("*")
      .single();

    createdReward = reward ?? null;

    await sb.from("memberships").update({ stamps_count: 0, updated_at: new Date().toISOString() }).eq("bar_id", bar.id).eq("customer_id", customerId);
  }

  return NextResponse.json({ ok: true, stamps: updated.stamps_count, createdReward });
}
