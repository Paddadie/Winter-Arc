import { useRegisterSW } from "virtual:pwa-register/react";

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
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        background: "var(--color-ink)",
        color: "white",
        padding: "var(--space-m) var(--space-l)",
        paddingBottom: "calc(var(--space-m) + env(safe-area-inset-bottom))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-m)",
        boxShadow: "0 -2px 12px rgba(15, 32, 39, 0.25)",
      }}
    >
      <span style={{ fontSize: "14px", fontWeight: 600 }}>Nouvelle version disponible</span>
      <div style={{ display: "flex", gap: "var(--space-s)", flexShrink: 0 }}>
        <button
          onClick={() => setNeedRefresh(false)}
          style={{
            border: "none",
            background: "transparent",
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "14px",
            fontWeight: 600,
            padding: "8px",
          }}
        >
          Plus tard
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          style={{
            border: "none",
            borderRadius: "var(--radius-m)",
            background: "white",
            color: "var(--color-ink)",
            fontSize: "14px",
            fontWeight: 700,
            padding: "8px 16px",
          }}
        >
          Mettre à jour
        </button>
      </div>
    </div>
  );
}