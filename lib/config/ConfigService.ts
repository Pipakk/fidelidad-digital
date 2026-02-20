import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { BusinessConfig } from "@/lib/CONFIG_SCHEMA";
import { validateBusinessConfig } from "@/lib/CONFIG_SCHEMA";
import { DEFAULT_CONFIG } from "@/lib/config/defaultConfig";
import { supabaseServer } from "@/lib/serverSupabase";

export type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  // legacy rule columns (back-compat)
  stamp_goal?: number | null;
  stamp_daily_limit?: number | null;
  reward_expires_days?: number | null;
  reward_title?: string | null;
  wheel_enabled?: boolean | null;
  wheel_cooldown_days?: number | null;
  // new
  config?: unknown | null;
};

function deepMerge<T>(base: T, patch: any): T {
  if (!patch || typeof patch !== "object") return base;
  if (Array.isArray(patch)) return patch as any;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && !Array.isArray(v) && (out as any)[k] && typeof (out as any)[k] === "object") {
      (out as any)[k] = deepMerge((out as any)[k], v);
    } else {
      (out as any)[k] = v;
    }
  }
  return out;
}

function cfgFromLegacy(bar: BusinessRow): Partial<BusinessConfig> {
  return {
    branding: {
      name: bar.name,
      logo_url: bar.logo_url ?? undefined,
      theme: {},
    },
    stamps: {
      goal: Number.isFinite(bar.stamp_goal as number) ? Number(bar.stamp_goal) : 8,
      daily_limit: Number.isFinite(bar.stamp_daily_limit as number) ? Number(bar.stamp_daily_limit) : 1,
      reward_title: bar.reward_title ?? undefined,
    },
    rewards: {
      expires_days: Number.isFinite(bar.reward_expires_days as number) ? Number(bar.reward_expires_days) : 30,
    },
    wheel: {
      enabled: typeof bar.wheel_enabled === "boolean" ? bar.wheel_enabled : true,
      cooldown_days: Number.isFinite(bar.wheel_cooldown_days as number) ? Number(bar.wheel_cooldown_days) : 7,
      segments: [
        { id: "stamp_1", label: "1 sello extra", type: "stamp" as const, value: 1, weight: 3, enabled: true },
        { id: "none_1", label: "Sigue jugando", type: "none" as const, weight: 6, enabled: true },
        { id: "reward_1", label: "5% dto próxima visita", type: "reward" as const, weight: 2, enabled: true },
        { id: "reward_2", label: "Tapa gratis", type: "reward" as const, weight: 1, enabled: true },
      ],
      ui: {},
    },
  };
}

async function fetchBusinessBySlug(slug: string): Promise<BusinessRow | null> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("bars")
    .select(
      "id,slug,name,logo_url,config,stamp_goal,stamp_daily_limit,reward_expires_days,reward_title,wheel_enabled,wheel_cooldown_days"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as any;
}

const cachedFetchBusinessBySlug = unstable_cache(fetchBusinessBySlug, ["business-by-slug"], {
  revalidate: 10, // config/theme changes picked up within 10s
});

export const ConfigService = {
  /**
   * Fetch bar/business by slug (server-side).
   */
  getBusinessBySlug: cache(async (slug: string) => {
    return await cachedFetchBusinessBySlug(slug);
  }),

  /**
   * Get validated config + safe defaults, multi-tenant by slug.
   * Backward compatibility: legacy columns are mapped into cfg and overridden by cfg JSON.
   */
  getConfig: cache(async (slug: string) => {
    const bar = await cachedFetchBusinessBySlug(slug);
    if (!bar) {
      return {
        business: null as BusinessRow | null,
        config: DEFAULT_CONFIG,
        issues: ["bar_not_found"],
      };
    }

    const legacy = cfgFromLegacy(bar);
    const merged = deepMerge(DEFAULT_CONFIG, deepMerge(legacy as any, (bar.config ?? {}) as any));
    const validated = validateBusinessConfig(merged);

    if (validated.ok) {
      return { business: bar, config: validated.value, issues: [] as string[] };
    }

    // If config is invalid, fallback still includes bar.config so theme/business_type/texts are preserved.
    const fallbackMerged = deepMerge(DEFAULT_CONFIG, deepMerge(legacy as any, (bar.config ?? {}) as any));
    const fallbackValidated = validateBusinessConfig(fallbackMerged);
    return {
      business: bar,
      config: fallbackValidated.ok ? fallbackValidated.value : merged as any,
      issues: validated.issues,
    };
  }),
};

