import type { ReactNode, CSSProperties } from "react";
import "./Card.css";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** @deprecated à retirer une fois toutes les features migrées vers des classes CSS. */
  style?: CSSProperties;
}

export function Card({ children, className, style }: CardProps) {
  const classes = ["card", className].filter(Boolean).join(" ");
  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}