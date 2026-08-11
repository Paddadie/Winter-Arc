import type { ReactNode } from "react";
import "./CardLabel.css";

interface CardLabelProps {
  children: ReactNode;
  className?: string;
}

/** Petit libellé en majuscules utilisé en tête de carte, dans toute l'app. */
export function CardLabel({ children, className }: CardLabelProps) {
  const classes = ["card-label", className].filter(Boolean).join(" ");
  return <p className={classes}>{children}</p>;
}