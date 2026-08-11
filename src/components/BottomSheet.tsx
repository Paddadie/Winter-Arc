import { useEffect, useState, type ReactNode } from "react";

const TRANSITION_MS = 220;

interface BottomSheetProps {
  onClose: () => void;
  /** Reçoit une fonction "close" animée à utiliser pour tout bouton fermer interne (✕, etc.). */
  children: (close: () => void) => ReactNode;
}

/**
 * Fiche du bas générique (fond assombri + panneau qui glisse depuis le bas),
 * réutilisée pour toute fiche de détail ou d'information de l'app. Reste
 * montée pendant l'animation de sortie avant de prévenir le parent via
 * onClose, pour que la fermeture soit aussi fluide que l'ouverture.
 */
export function BottomSheet({ onClose, children }: BottomSheetProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, TRANSITION_MS);
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        background: visible ? "rgba(15, 32, 39, 0.4)" : "rgba(15, 32, 39, 0)",
        transition: `background ${TRANSITION_MS}ms ease-out`,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: `transform ${TRANSITION_MS}ms ease-out`,
        }}
      >
        {children(handleClose)}
      </div>
    </div>
  );
}