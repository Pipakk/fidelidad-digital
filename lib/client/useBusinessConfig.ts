"use client";

import { useEffect, useState } from "react";
import type { BusinessConfig } from "@/lib/CONFIG_SCHEMA";

export type BusinessConfigResponse = {
  business: { id: string; slug: string; name: string; logo_url: string | null };
  config: BusinessConfig;
  issues: string[];
};

export function useBusinessConfig(slug: string) {
  const [data, setData] = useState<BusinessConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/business-config?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Error");
        if (!cancelled) setData(json as BusinessConfigResponse);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { data, loading, error };
}

