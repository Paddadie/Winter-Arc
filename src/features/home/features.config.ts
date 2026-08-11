/**
 * Registre central des fonctionnalités affichées sur la page d'accueil.
 * Pour ajouter une nouvelle tuile (ex: sommeil, calories...) :
 * 1. Créer le dossier src/features/<nom>
 * 2. Ajouter une entrée ici avec sa route, son libellé, son icône et sa couleur
 * Aucune autre modification n'est nécessaire pour que la tuile apparaisse à l'accueil.
 */
export interface FeatureTile {
  id: string;
  label: string;
  description: string;
  route: string;
  icon: string; // emoji simple, pas de dépendance à une lib d'icônes
  color: string; // couleur CSS var d'accent de la tuile
  colorSoft: string;
}

export const featureTiles: FeatureTile[] = [
  {
    id: "weight",
    label: "Régime",
    description: "Poids, objectif et trajectoire",
    route: "/regime",
    icon: "📈",
    color: "var(--color-coral)",
    colorSoft: "var(--color-coral-soft)",
  },
  {
    id: "apnea",
    label: "Apnée",
    description: "Chronomètre et performances",
    route: "/apnee",
    icon: "🫧",
    color: "var(--color-teal)",
    colorSoft: "var(--color-teal-soft)",
  },
  {
    id: "settings",
    label: "Réglages",
    description: "Export et import des données",
    route: "/reglages",
    icon: "⚙️",
    color: "var(--color-ink-muted)",
    colorSoft: "var(--color-border)",
  },
];
