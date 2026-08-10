import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface PageLayoutProps {
  title: string;
  accentColor: string;
  children: ReactNode;
  headerAction?: ReactNode;
}

/**
 * Layout commun à toutes les pages fonctionnelles (hors accueil).
 * Fournit le bouton retour et un en-tête cohérent.
 */
export function PageLayout({ title, accentColor, children, headerAction }: PageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-m) var(--space-l)",
          paddingTop: "calc(var(--space-l) + env(safe-area-inset-top))",
          position: "sticky",
          top: 0,
          background: "var(--color-surface)",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate("/")}
          aria-label="Retour à l'accueil"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            border: "none",
            background: "transparent",
            color: accentColor,
            fontSize: "17px",
            fontWeight: 600,
            padding: "8px 4px",
          }}
        >
          <span style={{ fontSize: "20px", lineHeight: 1 }}>‹</span>
          Accueil
        </button>
        {headerAction}
      </header>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "28px",
          fontWeight: 700,
          margin: "0 0 var(--space-m) 0",
          padding: "0 var(--space-l)",
        }}
      >
        {title}
      </h1>
      <main
        style={{
          flex: 1,
          padding: "0 var(--space-l) var(--space-xl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-l)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
