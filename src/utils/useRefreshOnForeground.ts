import { useEffect, useRef } from "react";

/**
 * Rejoue `refresh` chaque fois que l'application revient au premier plan.
 *
 * Une PWA installée sur l'écran d'accueil n'est presque jamais rechargée :
 * iOS la met en veille et la restaure telle quelle, parfois plusieurs jours
 * plus tard. Sans ce rafraîchissement, l'écran affiche encore les données —
 * et surtout la date — de la dernière ouverture.
 */
export function useRefreshOnForeground(refresh: () => void) {
  // Passer par une ref évite de réabonner l'écouteur à chaque rendu alors
  // que `refresh` est le plus souvent recréé à l'identique.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") refreshRef.current();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
}
