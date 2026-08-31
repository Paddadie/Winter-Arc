import { daysBetween } from "../utils/date";
import type { WeightEntry } from "../db/schema";

export interface WeightTrend {
  /** Date de référence des abscisses (x = 0), pour éviter de manipuler des timestamps. */
  originDate: string;
  /** Pente en kg par jour : négative quand le poids baisse. */
  slopeKgPerDay: number;
  /** Poids estimé par la droite à `originDate`. */
  interceptKg: number;
}

/**
 * Droite de tendance (régression linéaire par moindres carrés) calculée sur
 * les pesées RÉELLES uniquement.
 *
 * Les jours interpolés sont volontairement exclus : ce sont des valeurs
 * déduites de la droite reliant deux pesées, les inclure reviendrait à
 * compter plusieurs fois la même information et donnerait plus de poids aux
 * longues périodes sans pesée qu'aux pesées elles-mêmes.
 *
 * Retourne null s'il n'y a pas au moins deux pesées à des dates distinctes :
 * une droite de tendance n'aurait alors aucun sens.
 */
export function computeWeightTrend(entries: WeightEntry[]): WeightTrend | null {
  if (entries.length < 2) return null;

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const originDate = sorted[0].date;
  const samples = sorted.map((entry) => ({
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

  return { originDate, slopeKgPerDay, interceptKg };
}

/** Poids prédit par la droite de tendance à une date donnée (passée ou future). */
export function trendWeightAt(trend: WeightTrend, date: string): number {
  return trend.interceptKg + trend.slopeKgPerDay * daysBetween(trend.originDate, date);
}
