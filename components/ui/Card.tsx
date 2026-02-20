"use client";

import { useTheme } from "@/themes/ThemeContext";

type CardProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export function Card({ children, style }: CardProps) {
  const theme = useTheme();
  const color = theme.color;
  const t = theme.tokens;

  return (
    <div
      style={{
        borderRadius: t.radius,
        padding: t.space.lg,
        background: color.white,
        border: `1px solid ${color.border}`,
        boxShadow: `0 2px 12px ${color.shadow}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
