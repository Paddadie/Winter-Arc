import { addDays, daysBetween } from "../utils/date";
import { theoreticalWeightAt } from "./weightTrajectory";
import type { WeightEntry, WeightGoal } from "../db/schema";

export interface WeightSeriesPoint {
  date: string;
  weightKg: number | null;
  isReal: boolean;
  goalWeightKg: number | null;
}

/**
 * Construit une série jour par jour entre startDate et endDate (bornes incluses) :
 * - weightKg = mesure réelle si elle existe ce jour-là (isReal = true)
 * - sinon, valeur interpolée linéairement entre la mesure précédente et
 *   la mesure suivante connues (isReal = false)
 * - null si le jour est avant la première mesure ou après la dernière
 *   (on ne fabrique pas de données hors de la plage connue)
 * - goalWeightKg = poids théorique selon l'objectif actif, ou null si aucun objectif
 *
 * `entries` doit contenir toutes les mesures utiles, y compris celles hors de
 * [startDate, endDate], car l'interpolation aux bords de la fenêtre a besoin
 * de connaître les mesures voisines même si elles sont hors champ.
 */
export function buildWeightSeries(
  entries: WeightEntry[],
  goal: WeightGoal | null,
  startDate: string,
  endDate: string
): WeightSeriesPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const points: WeightSeriesPoint[] = [];

  let date = startDate;
  while (date <= endDate) {
    const exact = sorted.find((e) => e.date === date);
    let weightKg: number | null = null;
    let isReal = false;

    if (exact) {
      weightKg = exact.weightKg;
      isReal = true;
    } else {
      let prev: WeightEntry | undefined;
      let next: WeightEntry | undefined;
      for (const e of sorted) {
        if (e.date < date) prev = e;
        if (e.date > date && !next) next = e;
      }
      if (prev && next) {
        const totalDays = daysBetween(prev.date, next.date);
        const elapsedDays = daysBetween(prev.date, date);
        const raw = prev.weightKg + (next.weightKg - prev.weightKg) * (elapsedDays / totalDays);
        weightKg = Math.round(raw * 10) / 10;
      }
    }

    const goalWeightKg = goal ? Math.round(theoreticalWeightAt(goal, date) * 10) / 10 : null;

    points.push({ date, weightKg, isReal, goalWeightKg });
    date = addDays(date, 1);
  }

  return points;
}
