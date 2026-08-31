import type { ReactNode } from "react";
import "./CardLabel.css";

interface CardLabelProps {
  children: ReactNode;
  className?: string;
}

/**
 * Petit libellé en majuscules utilisé en tête de carte, dans toute l'app.
 * C'est un vrai titre de niveau 2 (le titre de page étant le h1) : la carte
 * qu'il introduit est une section de la page, pas un simple paragraphe.
 */
export function CardLabel({ children, className }: CardLabelProps) {
  const classes = ["card-label", className].filter(Boolean).join(" ");
  return <h2 className={classes}>{children}</h2>;
}