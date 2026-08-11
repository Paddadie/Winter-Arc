import type { ReactNode, CSSProperties } from "react";

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--color-surface-raised)",
        borderRadius: "var(--radius-l)",
        padding: "var(--space-l)",
        border: "1px solid var(--color-border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
