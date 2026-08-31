import type { ReactNode } from "react";
import "./Card.css";

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** Conteneur de base de l'app : une carte = une section thématique de la page. */
export function Card({ children, className }: CardProps) {
  const classes = ["card", className].filter(Boolean).join(" ");
  return <section className={classes}>{children}</section>;
}