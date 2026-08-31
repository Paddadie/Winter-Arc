import { useEffect, useState, type ReactNode } from "react";
import "./BottomSheet.css";

const TRANSITION_MS = 220; // doit rester synchro avec la durée des transitions dans BottomSheet.css

interface BottomSheetProps {
  onClose: () => void;
  /** Nom accessible du dialogue, annoncé à l'ouverture par les lecteurs d'écran. */
  label: string;
  /** Reçoit une fonction "close" animée à utiliser pour tout bouton fermer interne (✕, etc.). */
  children: (close: () => void) => ReactNode;
}

/**
 * Fiche du bas générique (fond assombri + panneau qui glisse depuis le bas),
 * réutilisée pour toute fiche de détail ou d'information de l'app. Reste
 * montée pendant l'animation de sortie avant de prévenir le parent via
 * onClose, pour que la fermeture soit aussi fluide que l'ouverture.
 */
export function BottomSheet({ onClose, label, children }: BottomSheetProps) {
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
      className={`bottom-sheet-backdrop ${visible ? "bottom-sheet-backdrop--visible" : ""}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`bottom-sheet-panel ${visible ? "bottom-sheet-panel--visible" : ""}`}
      >
        {children(handleClose)}
      </div>
    </div>
  );
}