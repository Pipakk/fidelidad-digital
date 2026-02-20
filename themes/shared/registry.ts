import type { BusinessConfig } from "@/lib/CONFIG_SCHEMA";
import type { Theme } from "../base/types";
import { cafeTheme } from "../cafe";
import { barberTheme } from "../barber";

export type ThemeKey = "cafe" | "bar" | "barber" | "gym" | "retail";

const themeRegistry: Record<ThemeKey, Theme> = {
  cafe: cafeTheme,
  bar: cafeTheme,
  barber: barberTheme,
  gym: cafeTheme,
  retail: cafeTheme,
};

/**
 * Resolves theme key from business config.
 * Prefer config.theme, then config.business_type; fallback "cafe".
 */
export function getThemeKeyFromConfig(config: BusinessConfig | null | undefined): ThemeKey {
  const explicit = config?.theme;
  if (explicit && isThemeKey(explicit)) return explicit;
  const type = config?.business_type;
  if (type && isThemeKey(type)) return type;
  return "cafe";
}

function isThemeKey(s: string): s is ThemeKey {
  return s === "cafe" || s === "bar" || s === "barber" || s === "gym" || s === "retail";
}

/**
 * Returns the theme for the given key. Always returns a valid theme (fallback cafe).
 */
export function getTheme(key: ThemeKey): Theme {
  return themeRegistry[key] ?? themeRegistry.cafe;
}

export { themeRegistry };
