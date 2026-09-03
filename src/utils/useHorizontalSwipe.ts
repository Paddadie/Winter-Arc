import { useRef, type TouchEvent } from "react";

/** Déplacement horizontal minimal, en pixels, pour qu'un geste compte comme un balayage. */
const SWIPE_MIN_DISTANCE = 60;

/**
 * Un balayage doit être franchement horizontal : en dessous de ce rapport avec
 * le déplacement vertical, le doigt fait défiler la fiche, il ne navigue pas.
 */
const HORIZONTAL_RATIO = 1.5;

/**
 * Décision du geste, isolée de React pour rester testable sans DOM : un
 * balayage doit être assez long ET franchement plus horizontal que vertical.
 */
export function swipeDirection(deltaX: number, deltaY: number): "left" | "right" | null {
  if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE) return null;
  if (Math.abs(deltaX) < Math.abs(deltaY) * HORIZONTAL_RATIO) return null;
  return deltaX < 0 ? "left" : "right";
}

interface SwipeActions {
  /** Balayage vers la gauche (le doigt part vers la gauche). */
  left?: () => void;
  /** Balayage vers la droite. */
  right?: () => void;
}

/**
 * Balayage horizontal au doigt, à répandre sur un conteneur via `{...handlers}`.
 *
 * Rien ne se passe pendant le geste : la décision est prise au relâché, en
 * comparant le déplacement horizontal au vertical. Un doigt qui descend pour
 * lire la suite de la fiche ne doit jamais déclencher une navigation.
 *
 * Tactile uniquement — l'app est une PWA iPhone. À la souris, la fiche reste
 * pilotée par ses boutons.
 */
export function useHorizontalSwipe({ left, right }: SwipeActions) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (event: TouchEvent) => {
      // Un pincement (zoom) n'est pas un balayage : on abandonne le suivi.
      if (event.touches.length > 1) {
        start.current = null;
        return;
      }
      start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    },
    onTouchEnd: (event: TouchEvent) => {
      const origin = start.current;
      start.current = null;
      if (!origin) return;

      const touch = event.changedTouches[0];
      const direction = swipeDirection(touch.clientX - origin.x, touch.clientY - origin.y);
      if (direction === "left") left?.();
      if (direction === "right") right?.();
    },
  };
}
