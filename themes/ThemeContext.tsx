"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Theme } from "./base/types";
import { getTheme } from "./shared/registry";
import { cafeTheme } from "./cafe";

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ theme, children }: { theme: Theme; children: ReactNode }) {
  const value = useMemo(() => theme, [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Returns the current theme. Outside bar layout (e.g. home) falls back to cafe theme.
 */
export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  return ctx ?? cafeTheme;
}
