"use client";

import { useTheme } from "@/themes/ThemeContext";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "primaryDark" | "secondary";
  children: React.ReactNode;
};

export function Button({ variant = "primary", children, style, ...props }: ButtonProps) {
  const theme = useTheme();
  const color = theme.color;
  const t = theme.tokens;

  const base: React.CSSProperties = {
    padding: t.space.sm,
    borderRadius: t.radius,
    border: "1px solid transparent",
    cursor: "pointer",
    fontWeight: t.font.weight.semibold,
    fontSize: 15,
    width: "100%",
    transition: "background 0.15s, border-color 0.15s",
  };

  const primary: React.CSSProperties = {
    ...base,
    background: color.primary,
    color: color.text,
    borderColor: color.primary,
  };

  const primaryDark: React.CSSProperties = {
    ...base,
    background: color.primaryDark,
    color: color.white,
    borderColor: color.primaryDark,
  };

  const secondary: React.CSSProperties = {
    ...base,
    background: "transparent",
    color: color.secondary,
    borderColor: color.primary,
  };

  const styleMap = { primary, primaryDark, secondary };
  const styles = styleMap[variant] ?? primary;

  return (
    <button
      style={{ ...styles, ...style }}
      onMouseEnter={(e) => {
        if (variant === "primary") {
          e.currentTarget.style.background = color.secondary;
          e.currentTarget.style.borderColor = color.secondary;
        } else if (variant === "primaryDark") {
          e.currentTarget.style.background = color.secondary;
          e.currentTarget.style.borderColor = color.secondary;
        } else {
          e.currentTarget.style.background = color.surface;
        }
      }}
      onMouseLeave={(e) => {
        if (variant === "primary") {
          e.currentTarget.style.background = color.primary;
          e.currentTarget.style.borderColor = color.primary;
        } else if (variant === "primaryDark") {
          e.currentTarget.style.background = color.primaryDark;
          e.currentTarget.style.borderColor = color.primaryDark;
        } else {
          e.currentTarget.style.background = "transparent";
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}
