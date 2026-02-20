"use client";

import { useMemo, type ReactNode } from "react";
import { useBusinessConfig } from "@/lib/client/useBusinessConfig";
import { getThemeKeyFromConfig, getTheme } from "@/themes/shared/registry";
import { ThemeProvider } from "@/themes/ThemeContext";

/**
 * Wraps bar layout children and provides theme from business config.
 * Resolves theme from config.theme || config.business_type; fallback cafe.
 */
export function BarThemeWrapper({ slug, children }: { slug: string; children: ReactNode }) {
  const { data } = useBusinessConfig(slug);
  const config = data?.config;

  const theme = useMemo(() => {
    const key = getThemeKeyFromConfig(config);
    return getTheme(key);
  }, [config]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
