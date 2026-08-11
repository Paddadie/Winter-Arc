import type { ReactNode, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import "./PageLayout.css";

interface PageLayoutProps {
  title: string;
  accentColor: string;
  children: ReactNode;
  headerAction?: ReactNode;
  /** Cible du bouton retour. Par défaut "/" (accueil) pour les pages de premier niveau. */
  backTo?: string;
  /** Libellé du bouton retour. Par défaut "Accueil". */
  backLabel?: string;
}

/**
 * Layout commun à toutes les pages fonctionnelles (hors accueil).
 * Fournit le bouton retour et un en-tête cohérent. `accentColor` est une
 * valeur choisie à l'exécution par chaque page (corail, teal...), passée à
 * la CSS via une custom property plutôt qu'un style inline complet.
 */
export function PageLayout({
  title,
  accentColor,
  children,
  headerAction,
  backTo = "/",
  backLabel = "Accueil",
}: PageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="page">
      <header className="page-header">
        <button
          onClick={() => navigate(backTo)}
          aria-label={`Retour${backLabel === "Accueil" ? " à l'accueil" : ` à ${backLabel}`}`}
          className="page-back-button"
          style={{ "--page-accent": accentColor } as CSSProperties}
        >
          <span className="page-back-icon">‹</span>
          {backLabel}
        </button>
        {headerAction}
      </header>
      <h1 className="page-title">{title}</h1>
      <main className="page-main">{children}</main>
    </div>
  );
}