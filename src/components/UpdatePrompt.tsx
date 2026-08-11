import { useRegisterSW } from "virtual:pwa-register/react";
import "./UpdatePrompt.css";

/**
 * Bandeau "Mettre à jour" affiché quand une nouvelle version de l'app est
 * détectée au chargement. Pas de mise à jour silencieuse (impossible en PWA
 * hors App Store) : l'utilisateur choisit le moment via ce bandeau.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error("Échec de l'enregistrement du service worker :", error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="update-prompt">
      <span className="update-prompt-text">Nouvelle version disponible</span>
      <div className="update-prompt-actions">
        <button onClick={() => setNeedRefresh(false)} className="update-prompt-dismiss">
          Plus tard
        </button>
        <button onClick={() => updateServiceWorker(true)} className="update-prompt-confirm">
          Mettre à jour
        </button>
      </div>
    </div>
  );
}