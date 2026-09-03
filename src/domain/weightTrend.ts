import { addDays, daysBetween } from "../utils/date";
import type { WeightEntry } from "../db/schema";

/**
 * Largeur de la fenêtre de pesées prise en compte, en jours (bornes incluses).
 *
 * Une droite calculée sur tout l'historique décrit surtout le passé lointain :
 * plus l'historique s'allonge, moins les pesées récentes pèsent dans la pente,
 * et la tendance affichée finit par ne plus refléter la dynamique du moment.
 * Deux semaines sont la valeur retenue par les applications de suivi de poids
 * du même genre : assez long pour lisser les variations d'eau et de digestion
 * d'un jour à l'autre, assez court pour réagir à un changement d'habitude.
 */
export const TREND_WINDOW_DAYS = 14;

/**
 * Nombre de jours pendant lesquels la droite est prolongée après la dernière
 * pesée. Volontairement la moitié de la fenêtre : une projection ne devrait
 * pas courir plus loin que la moitié de la période qui la fonde. Sans cette
 * borne, une tendance vieille de plusieurs semaines continuerait d'être tracée
 * jusqu'au bord du graphique, très loin de la dernière donnée réelle.
 */
const TREND_FORECAST_DAYS = 7;

export interface WeightTrend {
  /** Date de référence des abscisses (x = 0), pour éviter de manipuler des timestamps. */
  originDate: string;
  /** Pente en kg par jour : négative quand le poids baisse. */
  slopeKgPerDay: number;
  /** Poids estimé par la droite à `originDate`. */
  interceptKg: number;
  /** Dernière pesée prise en compte, au-delà de laquelle la droite s'arrête vite. */
  lastEntryDate: string;
}

/**
 * Droite de tendance (régression linéaire par moindres carrés) calculée sur
 * les pesées RÉELLES des `TREND_WINDOW_DAYS` derniers jours de mesure.
 *
 * La fenêtre est ancrée sur la dernière pesée, pas sur la date du jour : après
 * quelques jours sans se peser, une fenêtre ancrée sur aujourd'hui ne
 * contiendrait plus assez de pesées et la tendance disparaîtrait alors qu'il y
 * a bien deux semaines de données à exploiter, un peu plus anciennes.
 *
 * Les jours interpolés sont volontairement exclus : ce sont des valeurs
 * déduites de la droite reliant deux pesées, les inclure reviendrait à
 * compter plusieurs fois la même information et donnerait plus de poids aux
 * longues périodes sans pesée qu'aux pesées elles-mêmes.
 *
 * Retourne null s'il n'y a pas au moins deux pesées à des dates distinctes
 * dans la fenêtre : une droite de tendance n'aurait alors aucun sens.
 */
export function computeWeightTrend(entries: WeightEntry[]): WeightTrend | null {
  if (entries.length < 2) return null;

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const lastEntryDate = sorted[sorted.length - 1].date;
  const windowStart = addDays(lastEntryDate, -(TREND_WINDOW_DAYS - 1));
  const recent = sorted.filter((entry) => entry.date >= windowStart);
  if (recent.length < 2) return null;

  const originDate = recent[0].date;
  const samples = recent.map((entry) => ({
    x: daysBetween(originDate, entry.date),
    y: entry.weightKg,
  }));

  const count = samples.length;
  const sumX = samples.reduce((sum, s) => sum + s.x, 0);
  const sumY = samples.reduce((sum, s) => sum + s.y, 0);
  const sumXY = samples.reduce((sum, s) => sum + s.x * s.y, 0);
  const sumXX = samples.reduce((sum, s) => sum + s.x * s.x, 0);

  // Nul quand toutes les pesées tombent le même jour : la droite serait verticale.
  const denominator = count * sumXX - sumX * sumX;
  if (denominator === 0) return null;

  const slopeKgPerDay = (count * sumXY - sumX * sumY) / denominator;
  const interceptKg = (sumY - slopeKgPerDay * sumX) / count;

  return { originDate, slopeKgPerDay, interceptKg, lastEntryDate };
}

/**
 * Poids prédit par la droite de tendance à une date donnée, ou null en dehors
 * de la plage où elle a du sens : avant la première pesée de la fenêtre (la
 * droite ne dit rien d'un passé qu'elle n'a pas observé) et au-delà de
 * `TREND_FORECAST_DAYS` après la dernière pesée.
 */
export function trendWeightAt(trend: WeightTrend, date: string): number | null {
  if (date < trend.originDate) return null;
  if (date > addDays(trend.lastEntryDate, TREND_FORECAST_DAYS)) return null;
  return trend.interceptKg + trend.slopeKgPerDay * daysBetween(trend.originDate, date);
}
