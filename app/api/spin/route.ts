import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/serverSupabase";
import { ConfigService } from "@/lib/config/ConfigService";
import type { WheelSegment } from "@/lib/CONFIG_SCHEMA";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { barSlug?: string; customerId?: string };
    const barSlug = body.barSlug;
    const customerId = body.customerId;

    if (!barSlug || !customerId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const sb = supabaseServer();
    const { business: bar, config: cfg } = await ConfigService.getConfig(barSlug);

    if (!bar) return NextResponse.json({ error: cfg.texts.api.bar_not_found }, { status: 404 });
    if (cfg.wheel.enabled === false) return NextResponse.json({ error: cfg.texts.api.wheel_disabled }, { status: 403 });

    // Sin límite de tiradas: no se aplica cooldown.

    const segments = (cfg.wheel.segments || []).filter((s) => s && s.enabled !== false);
    const chosen = pickWeighted(segments);
    if (!chosen) return NextResponse.json({ error: cfg.texts.api.wheel_disabled }, { status: 403 });

    const spinId = crypto.randomUUID();
    const label = chosen.label;

    // none
    if (chosen.type === "none") {
      await sb.from("wheel_spins").insert({
        id: spinId,
        bar_id: bar.id,
        customer_id: customerId,
        reward_id: null,
        segment_id: chosen.id,
        segment_label: chosen.label,
        segment_type: chosen.type,
      });
      return NextResponse.json({ prize: label, segmentId: chosen.id, type: chosen.type, saved: false });
    }

    // stamp
    if (chosen.type === "stamp") {
      const add = Number.isFinite(chosen.value as any) ? Number(chosen.value) : 1;
      const stampsToAdd = Math.max(0, Math.trunc(add));

      const { data: membership, error: memErr } = await sb
        .from("memberships")
        .select("id,stamps_count")
        .eq("bar_id", bar.id)
        .eq("customer_id", customerId)
        .maybeSingle();

      if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });

      if (!membership) {
        const { error: insMemErr } = await sb.from("memberships").insert({
          bar_id: bar.id,
          customer_id: customerId,
          stamps_count: 0,
        });
        if (insMemErr) return NextResponse.json({ error: insMemErr.message }, { status: 500 });
      }

      const current = membership?.stamps_count ?? 0;
      const { data: updated, error: updErr } = await sb
        .from("memberships")
        .update({ stamps_count: current + stampsToAdd, updated_at: new Date().toISOString() })
        .eq("bar_id", bar.id)
        .eq("customer_id", customerId)
        .select("stamps_count")
        .single();

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

      await sb.from("wheel_spins").insert({
        id: spinId,
        bar_id: bar.id,
        customer_id: customerId,
        reward_id: null,
        segment_id: chosen.id,
        segment_label: chosen.label,
        segment_type: chosen.type,
      });

      return NextResponse.json({
        prize: label,
        segmentId: chosen.id,
        type: chosen.type,
        saved: true,
        stampsAdded: stampsToAdd,
        stamps: updated?.stamps_count ?? current + stampsToAdd,
      });
    }

    // reward
    const expires = new Date();
    const days = Number(cfg.rewards.expires_days ?? 30);
    expires.setDate(expires.getDate() + (Number.isFinite(days) ? days : 30));

    const { data: reward, error: rErr } = await sb
      .from("rewards")
      .insert({
        bar_id: bar.id,
        customer_id: customerId,
        source: "wheel",
        title: label,
        status: "active",
        expires_at: expires.toISOString(),
      })
      .select("id,title,source,status,expires_at")
      .single();

    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

    await sb.from("wheel_spins").insert({
      id: spinId,
      bar_id: bar.id,
      customer_id: customerId,
      reward_id: reward.id,
      segment_id: chosen.id,
      segment_label: chosen.label,
      segment_type: chosen.type,
    });

    return NextResponse.json({ prize: label, segmentId: chosen.id, type: chosen.type, saved: true, reward });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

function pickWeighted(segments: WheelSegment[]) {
  const enabled = (segments || []).filter((s) => s && s.enabled !== false);
  let total = 0;
  for (const s of enabled) total += Math.max(0, Math.trunc(Number(s.weight ?? 0)));
  if (!Number.isFinite(total) || total <= 0) return null;

  let r = Math.random() * total;
  for (const s of enabled) {
    const w = Math.max(0, Math.trunc(Number(s.weight ?? 0)));
    if (w <= 0) continue;
    r -= w;
    if (r < 0) return s;
  }
  return enabled[enabled.length - 1] ?? null;
}
