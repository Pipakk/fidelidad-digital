import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/serverSupabase";
import crypto from "crypto";

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req: Request) {
  const { rewardId, barSlug, staffPin } = (await req.json()) as { rewardId: string; barSlug: string; staffPin: string };

  if (!rewardId || !barSlug || !staffPin) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const sb = supabaseServer();

  const { data: bar } = await sb.from("bars").select("*").eq("slug", barSlug).single();
  if (!bar) return NextResponse.json({ error: "Bar not found" }, { status: 404 });

  const pinHash = sha256(staffPin);
  const { data: staff } = await sb.from("staff_users").select("id").eq("bar_id", bar.id).eq("pin_hash", pinHash).maybeSingle();
  if (!staff) return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });

  const { data: reward } = await sb.from("rewards").select("*").eq("id", rewardId).eq("bar_id", bar.id).single();
  if (!reward) return NextResponse.json({ error: "Reward not found" }, { status: 404 });
  if (reward.status !== "active") return NextResponse.json({ error: "Reward not active" }, { status: 409 });

  await sb.from("rewards").update({ status: "redeemed" }).eq("id", rewardId);

  return NextResponse.json({ ok: true });
}
