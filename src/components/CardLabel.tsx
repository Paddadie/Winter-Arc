import type { ReactNode, CSSProperties } from "react";
import "./CardLabel.css";

interface CardLabelProps {
  children: ReactNode;
  className?: string;
  /** @deprecated à retirer une fois toutes les features migrées vers des classes CSS. */
  style?: CSSProperties;
}

/** Petit libellé en majuscules utilisé en tête de carte, dans toute l'app. */
export function CardLabel({ children, className, style }: CardLabelProps) {
  const classes = ["card-label", className].filter(Boolean).join(" ");
  return (
    <p className={classes} style={style}>
      {children}
    </p>
  );
}