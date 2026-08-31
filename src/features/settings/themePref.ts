const STORAGE_KEY = "winter-arc:theme";

export type Theme = "light" | "dark";

/**
 * Couleur de la barre d'état iOS, qui doit suivre le fond de l'app.
 * Miroir de --color-surface dans src/index.css : une valeur en dur est
 * inévitable ici, le navigateur lisant cette balise avant tout calcul CSS.
 */
const SURFACE_COLOR: Record<Theme, string> = {
  light: "#F5F7F7",
  dark: "#0E1518",
};

/**
 * Le thème effectif est posé sur <html data-theme> par le script en tête de
 * index.html, avant le premier rendu : c'est lui la source de vérité, qu'il
 * vienne d'un choix enregistré ou, à défaut, du réglage système.
 */
export function isDarkModeEnabled(): boolean {
  return document.documentElement.dataset.theme === "dark";
}

export function setDarkModeEnabled(enabled: boolean): void {
  const theme: Theme = enabled ? "dark" : "light";
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Stockage indisponible : le thème s'applique quand même pour cette session.
  }
  applyTheme(theme);
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", SURFACE_COLOR[theme]);
}
