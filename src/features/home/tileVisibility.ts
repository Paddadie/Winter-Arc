import type { FeatureId } from "./features.config";

const STORAGE_KEY = "winter-arc:hidden-tiles";

/**
 * Préférence d'affichage des tuiles d'accueil, stockée en localStorage
 * (pas en IndexedDB) : c'est un réglage propre à cet appareil/utilisateur
 * de l'app, pas une donnée à sauvegarder/restaurer via l'export JSON.
 */
export function getHiddenTileIds(): Set<FeatureId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as FeatureId[]) : []);
  } catch {
    // Préférence illisible (JSON corrompu, stockage inaccessible) : on
    // retombe sur "rien de masqué" plutôt que de faire échouer l'accueil.
    return new Set();
  }
}

export function setTileHidden(id: FeatureId, hidden: boolean): void {
  const hiddenIds = getHiddenTileIds();
  if (hidden) {
    hiddenIds.add(id);
  } else {
    hiddenIds.delete(id);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...hiddenIds]));
}