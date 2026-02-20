"use client";

import { theme } from "@/lib/theme";

type CardProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        borderRadius: theme.radius,
        padding: theme.space.lg,
        background: theme.color.white,
        border: `1px solid ${theme.color.border}`,
        boxShadow: `0 2px 12px ${theme.color.shadow}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
