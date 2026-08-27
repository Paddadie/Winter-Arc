const STORAGE_KEY = "winter-arc:period-tracking-enabled";

/**
 * Préférence d'activation du suivi du cycle, propre à cet appareil
 * (localStorage, pas IndexedDB) — désactivée par défaut, pour que l'app
 * reste neutre tant que personne ne l'a explicitement activée dans les
 * réglages (utile pour un appareil partagé ou une app installée par
 * plusieurs membres d'une même famille).
 */
export function isPeriodTrackingEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function setPeriodTrackingEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(enabled));
}
