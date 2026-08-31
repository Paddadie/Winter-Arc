import { addDays, daysBetween } from "../utils/date";
import { theoreticalWeightAt } from "./weightTrajectory";
import { computeWeightTrend, trendWeightAt } from "./weightTrend";
import type { WeightEntry, WeightGoal, DailyLog } from "../db/schema";

export interface WeightSeriesPoint {
  date: string;
  weightKg: number | null;
  isReal: boolean;
  goalWeightKg: number | null;
  /** null = aucun journal saisi ce jour-là (distinct de "saisi comme non fait") */
  sport: boolean | null;
  foodDeviation: boolean | null;
  /** Suivi du cycle, si la fonctionnalité est activée dans les réglages. */
  period: boolean | null;
  /**
   * Droite de tendance calculée sur les pesées réelles, prolongée sur toute
   * la fenêtre (jours futurs compris). Volontairement NON arrondie au
   * dixième, contrairement aux autres poids : sur une fenêtre courte la
   * pente est faible, et arrondir transformerait la droite en escalier.
   */
  trendWeightKg: number | null;
}

/**
 * Construit une série jour par jour entre startDate et endDate (bornes incluses) :
 * - weightKg = mesure réelle si elle existe ce jour-là (isReal = true)
 * - sinon, valeur interpolée linéairement entre la mesure précédente et
 *   la mesure suivante connues (isReal = false)
 * - null si le jour est avant la première mesure ou après la dernière
 *   (on ne fabrique pas de données hors de la plage connue)
 * - goalWeightKg = poids théorique selon l'objectif actif, ou null si aucun objectif
 * - sport/foodDeviation/period = valeur du journal du jour, ou null si aucun journal saisi
 * - trendWeightKg = droite de tendance des pesées réelles, ou null si moins de deux pesées
 *
 * `entries` doit contenir toutes les mesures utiles, y compris celles hors de
 * [startDate, endDate], car l'interpolation aux bords de la fenêtre a besoin
 * de connaître les mesures voisines même si elles sont hors champ.
 */
export function buildWeightSeries(
  entries: WeightEntry[],
  goal: WeightGoal | null,
  startDate: string,
  endDate: string,
  dailyLogs: DailyLog[] = []
): WeightSeriesPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const logsByDate = new Map(dailyLogs.map((log) => [log.date, log]));
  const trend = computeWeightTrend(entries);
  const points: WeightSeriesPoint[] = [];

  // Les jours sont parcourus dans l'ordre croissant : un simple curseur sur
  // les mesures triées suffit à connaître, pour chaque jour, la mesure qui
  // précède et celle qui suit — inutile de re-balayer toute la liste des
  // pesées à chaque jour de la fenêtre.
  let cursor = 0;
  let previous: WeightEntry | undefined;

  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    while (cursor < sorted.length && sorted[cursor].date < date) {
      previous = sorted[cursor];
      cursor += 1;
    }

    const measured = sorted[cursor]?.date === date ? sorted[cursor] : undefined;
    const next = measured ? undefined : sorted[cursor];
    const log = logsByDate.get(date);

    points.push({
      date,
      weightKg: measured ? measured.weightKg : interpolateWeight(previous, next, date),
      isReal: measured !== undefined,
      goalWeightKg: goal ? roundToTenth(theoreticalWeightAt(goal, date)) : null,
      sport: log ? log.sport : null,
      foodDeviation: log ? log.foodDeviation : null,
      period: log ? log.period ?? null : null,
      trendWeightKg: trend ? trendWeightAt(trend, date) : null,
    });
  }

  return points;
}

/**
 * Poids estimé un jour sans pesée, par interpolation linéaire entre les deux
 * mesures qui l'encadrent. null si le jour n'est pas encadré : avant la
 * première pesée ou après la dernière, on préfère un trou dans la courbe à
 * une donnée inventée.
 */
function interpolateWeight(
  previous: WeightEntry | undefined,
  next: WeightEntry | undefined,
  date: string
): number | null {
  if (!previous || !next) return null;
  const totalDays = daysBetween(previous.date, next.date);
  const elapsedDays = daysBetween(previous.date, date);
  return roundToTenth(previous.weightKg + (next.weightKg - previous.weightKg) * (elapsedDays / totalDays));
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
