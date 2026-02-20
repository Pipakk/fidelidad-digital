"use client";

import { theme } from "@/lib/theme";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "primaryDark" | "secondary";
  children: React.ReactNode;
};

export function Button({ variant = "primary", children, style, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    padding: theme.space.sm,
    borderRadius: theme.radius,
    border: "1px solid transparent",
    cursor: "pointer",
    fontWeight: theme.font.weight.semibold,
    fontSize: 15,
    width: "100%",
    transition: "background 0.15s, border-color 0.15s",
  };

  const primary: React.CSSProperties = {
    ...base,
    background: theme.color.camel,
    color: theme.color.text,
    borderColor: theme.color.camel,
  };

  const primaryDark: React.CSSProperties = {
    ...base,
    background: theme.color.primaryDark,
    color: theme.color.white,
    borderColor: theme.color.primaryDark,
  };

  const secondary: React.CSSProperties = {
    ...base,
    background: "transparent",
    color: theme.color.camelDark,
    borderColor: theme.color.camel,
  };

  const styleMap = { primary, primaryDark, secondary };
  const styles = styleMap[variant] ?? primary;

  return (
    <button
      style={{ ...styles, ...style }}
      onMouseEnter={(e) => {
        if (variant === "primary") {
          e.currentTarget.style.background = theme.color.camelDark;
          e.currentTarget.style.borderColor = theme.color.camelDark;
        } else if (variant === "primaryDark") {
          e.currentTarget.style.background = theme.color.camelDark;
          e.currentTarget.style.borderColor = theme.color.camelDark;
        } else {
          e.currentTarget.style.background = theme.color.sand;
        }
      }}
      onMouseLeave={(e) => {
        if (variant === "primary") {
          e.currentTarget.style.background = theme.color.camel;
          e.currentTarget.style.borderColor = theme.color.camel;
        } else if (variant === "primaryDark") {
          e.currentTarget.style.background = theme.color.primaryDark;
          e.currentTarget.style.borderColor = theme.color.primaryDark;
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
