import { Component, type ErrorInfo, type ReactNode } from "react";
import "./ErrorBoundary.css";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Dernier filet de sécurité de l'application.
 *
 * En PWA installée sur l'écran d'accueil, une erreur de rendu non rattrapée
 * laisse un écran blanc, sans console ni bouton de rechargement accessible :
 * l'app paraît définitivement cassée. On affiche donc un écran de secours
 * avec un rechargement, seule action utile dans ce contexte.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erreur non rattrapée :", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary">
        <h1 className="error-boundary-title">Une erreur est survenue</h1>
        <p className="error-boundary-text">
          L'application n'a pas pu s'afficher. Tes données enregistrées ne sont pas affectées.
        </p>
        <button onClick={() => window.location.reload()} className="error-boundary-button">
          Recharger
        </button>
      </div>
    );
  }
}
