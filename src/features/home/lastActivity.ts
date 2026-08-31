import { getLatestWeightEntry } from "../../db/weightRepo";
import { getLatestApneaSession } from "../../db/apneaRepo";
import type { FeatureId } from "./features.config";

/**
 * Où lire la date de dernière utilisation de chaque fonctionnalité.
 *
 * Le type `Record<FeatureId, …>` est délibéré : ajouter un identifiant à
 * FeatureId sans ajouter sa source ici ne compile pas. C'est ce qui garantit
 * qu'une future tuile aura son rappel d'accueil sans qu'on y pense.
 */
const LAST_ACTIVITY_SOURCES: Record<FeatureId, () => Promise<string | null>> = {
  weight: async () => (await getLatestWeightEntry())?.date ?? null,
  apnea: async () => (await getLatestApneaSession())?.date ?? null,
};

/** Date ISO de dernière utilisation par fonctionnalité, null si jamais utilisée. */
export async function getLastActivityDates(): Promise<Record<FeatureId, string | null>> {
  const featureIds = Object.keys(LAST_ACTIVITY_SOURCES) as FeatureId[];
  const dates = await Promise.all(featureIds.map((id) => LAST_ACTIVITY_SOURCES[id]()));
  return Object.fromEntries(featureIds.map((id, i) => [id, dates[i]])) as Record<FeatureId, string | null>;
}
