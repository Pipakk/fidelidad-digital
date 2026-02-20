"use client";

import { useTheme } from "@/themes/ThemeContext";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, style, ...props }: InputProps) {
  const theme = useTheme();
  const color = theme.color;
  const t = theme.tokens;

  return (
    <div style={{ marginBottom: t.space.sm }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 14,
            color: color.text,
            marginBottom: 6,
            fontWeight: t.font.weight.medium,
          }}
        >
          {label}
        </label>
      )}
      <input
        style={{
          width: "100%",
          padding: t.space.sm,
          borderRadius: t.radius,
          border: `1px solid ${color.border}`,
          background: color.white,
          color: color.text,
          fontSize: 15,
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = color.borderFocus;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = color.border;
        }}
        {...props}
      />
    </div>
  );
}
