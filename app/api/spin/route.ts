import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/serverSupabase";

function pickPrize() {
  const prizes = [
    { title: "1 sello extra", weight: 45 },
    { title: "Tapa gratis", weight: 10 },
    { title: "5% dto próxima visita", weight: 15 },
    { title: "Sigue jugando", weight: 30 },
  ];
  const total = prizes.reduce((a, p) => a + p.weight, 0);
  let r = Math.random() * total;
  for (const p of prizes) {
    r -= p.weight;
    if (r <= 0) return p.title;
  }
  return "Sigue jugando";
}

export async function POST(req: Request) {
  const { barSlug, customerId } = (await req.json()) as { barSlug: string; customerId: string };

  if (!barSlug || !customerId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const sb = supabaseServer();

  const { data: bar } = await sb.from("bars").select("*").eq("slug", barSlug).single();
  if (!bar) return NextResponse.json({ error: "Bar not found" }, { status: 404 });
  if (!bar.wheel_enabled) return NextResponse.json({ error: "Wheel disabled" }, { status: 403 });

  const since = new Date();
  since.setDate(since.getDate() - bar.wheel_cooldown_days);

  const { data: lastSpin } = await sb
    .from("wheel_spins")
    .select("created_at")
    .eq("bar_id", bar.id)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastSpin?.created_at && new Date(lastSpin.created_at) > since) {
    return NextResponse.json({ error: "Cooldown active" }, { status: 429 });
  }

  const prize = pickPrize();
  let rewardId: string | null = null;

  if (prize !== "Sigue jugando") {
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    const { data: reward } = await sb
      .from("rewards")
      .insert({ bar_id: bar.id, customer_id: customerId, source: "wheel", title: prize, expires_at: expires.toISOString() })
      .select("id")
      .single();

    rewardId = reward?.id ?? null;

    if (prize === "1 sello extra") {
      const { data: m } = await sb.from("memberships").select("*").eq("bar_id", bar.id).eq("customer_id", customerId).maybeSingle();
      if (m) {
        await sb.from("memberships").update({ stamps_count: m.stamps_count + 1, updated_at: new Date().toISOString() }).eq("bar_id", bar.id).eq("customer_id", customerId);
      } else {
        await sb.from("memberships").insert({ bar_id: bar.id, customer_id: customerId, stamps_count: 1 });
      }
    }
  }

  await sb.from("wheel_spins").insert({ bar_id: bar.id, customer_id: customerId, reward_id: rewardId });

  return NextResponse.json({ ok: true, prize, rewardId });
}
