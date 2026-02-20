/**
 * Design tokens — gama camel, minimal, editorial.
 * Uso: import { theme } from "@/lib/theme"
 */
export const theme = {
  color: {
    camelLight: "#D2B48C",
    camel: "#C19A6B",
    camelDark: "#A67B5B",
    sand: "#E8D8C3",
    ivory: "#F5EFE6",
    text: "#3E2F26",
    textSoft: "#2B211C",
    white: "#FFFFFF",
    border: "rgba(163, 123, 91, 0.25)",
    borderFocus: "#A67B5B",
    shadow: "rgba(62, 47, 38, 0.06)",
    /** Botón primario estilo landing (fondo oscuro, texto blanco) */
    primaryDark: "#AA7E56",
    /** Borde madera ruleta */
    wood: "#5C4033",
    /** Verde "Listo para usar" en premios */
    ready: "#6B8E6B",
  },
  radius: 12,
  font: {
    sans: '"Inter", "Poppins", system-ui, -apple-system, sans-serif',
    weight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  space: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;

export type Theme = typeof theme;
