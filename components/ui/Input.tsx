"use client";

import { theme } from "@/lib/theme";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, style, ...props }: InputProps) {
  return (
    <div style={{ marginBottom: theme.space.sm }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 14,
            color: theme.color.text,
            marginBottom: 6,
            fontWeight: theme.font.weight.medium,
          }}
        >
          {label}
        </label>
      )}
      <input
        style={{
          width: "100%",
          padding: theme.space.sm,
          borderRadius: theme.radius,
          border: `1px solid ${theme.color.border}`,
          background: theme.color.white,
          color: theme.color.text,
          fontSize: 15,
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = theme.color.borderFocus;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = theme.color.border;
        }}
        {...props}
      />
    </div>
  );
}
