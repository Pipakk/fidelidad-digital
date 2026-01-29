import { NextResponse } from "next/server";
import { BusinessConfigSchema } from "@/lib/CONFIG_SCHEMA";
import { DEFAULT_CONFIG } from "@/lib/config/defaultConfig";

export async function GET() {
  const defaults = BusinessConfigSchema.safeParse(DEFAULT_CONFIG);
  const empty = BusinessConfigSchema.safeParse({});
  const minimalWheel = BusinessConfigSchema.safeParse({
    wheel: {
      enabled: true,
      cooldown_days: 7,
      segments: [
        { id: "a", label: "A", type: "none", weight: 1, enabled: true },
        { id: "b", label: "B", type: "reward", weight: 1, enabled: true },
        { id: "c", label: "C", type: "stamp", value: 1, weight: 1, enabled: true },
        { id: "d", label: "D", type: "none", weight: 1, enabled: true },
      ],
    },
  });

  return NextResponse.json({
    ok: defaults.success && empty.success && minimalWheel.success,
    checks: {
      defaults: defaults.success,
      emptyUsesDefaults: empty.success,
      wheelSegmentsN: minimalWheel.success,
    },
    defaults_snapshot: {
      stamps_goal: DEFAULT_CONFIG.stamps.goal,
      stamps_daily_limit: DEFAULT_CONFIG.stamps.daily_limit,
      rewards_expires_days: DEFAULT_CONFIG.rewards.expires_days,
      wheel_enabled: DEFAULT_CONFIG.wheel.enabled,
      wheel_cooldown_days: DEFAULT_CONFIG.wheel.cooldown_days,
      wheel_segments_count: DEFAULT_CONFIG.wheel.segments.length,
    },
  });
}

