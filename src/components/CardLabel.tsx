import type { ReactNode, CSSProperties } from "react";

/** Petit libellé en majuscules utilisé en tête de carte, dans toute l'app. */
export function CardLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p
      style={{
        margin: "0 0 var(--space-s) 0",
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--color-ink-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        ...style,
      }}
    >
      {children}
    </p>
  );
}
