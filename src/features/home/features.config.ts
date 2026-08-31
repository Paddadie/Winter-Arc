/**
 * Registre central des fonctionnalités affichées sur la page d'accueil.
 * Pour ajouter une nouvelle tuile (ex: sommeil, calories...) :
 * 1. Créer le dossier src/features/<nom>
 * 2. Ajouter son identifiant à FeatureId
 * 3. Ajouter une entrée ici (route, libellé, icône, couleur, rappel)
 * 4. Déclarer sa source de dernière activité dans home/lastActivity.ts
 *    (le typage l'exige : oublier cette étape casse la compilation)
 */
/**
 * Identifiants des fonctionnalités, référencés ailleurs qu'ici (visibilité
 * des tuiles, checklist du jour, grille de suivi) : les typer évite qu'une
 * faute de frappe passe inaperçue et fasse disparaître une ligne sans erreur.
 */
export type FeatureId = "weight" | "apnea";

export interface FeatureTile {
  id: FeatureId;
  label: string;
  description: string;
  route: string;
  icon: string; // emoji simple, pas de dépendance à une lib d'icônes
  color: string; // couleur CSS var d'accent de la tuile
  colorSoft: string;
  reminder: FeatureReminderConfig;
}

/**
 * Rappel affiché sur la tuile quand la fonctionnalité n'a pas servi depuis
 * un moment. Le seuil est propre à chaque fonctionnalité : on se pèse tous
 * les jours, on ne fait pas forcément une apnée quotidienne.
 */
export interface FeatureReminderConfig {
  /** Nombre de jours d'inactivité à partir duquel le rappel apparaît. */
  afterDays: number;
  /** Nom de l'action, inséré dans "X jours sans <nom>". */
  noun: string;
  /** Rappel affiché tant que la fonctionnalité n'a jamais servi. */
  neverLabel: string;
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
    reminder: { afterDays: 5, noun: "pesée", neverLabel: "Aucune pesée" },
  },
  {
    id: "apnea",
    label: "Apnée",
    description: "Chronomètre et performances",
    route: "/apnee",
    icon: "🫧",
    color: "var(--color-teal)",
    colorSoft: "var(--color-teal-soft)",
    reminder: { afterDays: 5, noun: "mesure", neverLabel: "Aucune mesure" },
  },
];
