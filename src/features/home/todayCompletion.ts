import { getWeightEntriesBetween } from "../../db/weightRepo";
import { getDailyLog } from "../../db/dailyLogRepo";
import { getLatestApneaSession } from "../../db/apneaRepo";
import type { FeatureId } from "./features.config";

/**
 * Ce que chaque fonctionnalité attend d'une journée pour être considérée comme
 * faite — c'est ce qui éteint la pastille de sa tuile d'accueil.
 *
 * Distinct de `lastActivity.ts`, qui répond à l'autre question : « depuis
 * combien de jours cette fonctionnalité ne sert plus ». La pesée du jour suffit
 * à relancer ce compteur-là, mais pas à éteindre la pastille.
 *
 * Le `Record<FeatureId, …>` est délibéré, comme pour `lastActivity` : ajouter
 * une fonctionnalité sans dire ce qu'elle attend d'un jour ne compile pas.
 */
const DONE_TODAY_SOURCES: Record<FeatureId, (today: string) => Promise<boolean>> = {
  // Le régime demande DEUX saisies : la pesée ET le journal du jour. La
  // pastille reste donc tant que sport et écart n'ont pas été tranchés, même
  // une fois le poids entré. Toucher une seule puce suffit : `setDailyLog`
  // crée le journal du jour, les autres puces passant à « non ». Une journée
  // sans sport ni écart garde donc sa pastille jusqu'au soir — c'est assumé,
  // rien ne distingue « pas encore répondu » de « rien à signaler ».
  weight: async (today) =>
    (await getWeightEntriesBetween(today, today)).length > 0 && (await getDailyLog(today)) !== null,
  apnea: async (today) => (await getLatestApneaSession())?.date === today,
};

/** Pour chaque fonctionnalité : la journée du jour est-elle complète ? */
export async function getDoneTodayFlags(today: string): Promise<Record<FeatureId, boolean>> {
  const featureIds = Object.keys(DONE_TODAY_SOURCES) as FeatureId[];
  const flags = await Promise.all(featureIds.map((id) => DONE_TODAY_SOURCES[id](today)));
  return Object.fromEntries(featureIds.map((id, i) => [id, flags[i]])) as Record<FeatureId, boolean>;
}
