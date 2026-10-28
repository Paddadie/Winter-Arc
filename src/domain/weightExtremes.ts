import type { WeightSeriesPoint } from "./weightSeries";

export interface WeightExtreme {
  date: string;
  weightKg: number;
}

export interface WeightExtremes {
  max: WeightExtreme;
  /** null quand il n'y aurait rien à distinguer du max (pesée unique, poids tous égaux). */
  min: WeightExtreme | null;
}

/**
 * Pesée la plus haute et la plus basse de la série, ou null sans aucune pesée.
 *
 * Seules les pesées réelles comptent : un jour interpolé n'est pas une mesure,
 * et l'étiqueter donnerait un « record » que l'utilisateur n'a jamais pesé.
 *
 * En cas d'égalité, la pesée la plus RÉCENTE l'emporte (la série est triée par
 * date croissante, d'où les `>=` / `<=`) : une seule étiquette par extrême.
 * Le min est omis s'il vaut le max, pour ne pas poser deux étiquettes
 * identiques sur la même valeur.
 */
export function findWeightExtremes(series: WeightSeriesPoint[]): WeightExtremes | null {
  let max: WeightExtreme | null = null;
  let min: WeightExtreme | null = null;

  for (const point of series) {
    if (!point.isReal || point.weightKg === null) continue;
    const candidate = { date: point.date, weightKg: point.weightKg };
    if (max === null || candidate.weightKg >= max.weightKg) max = candidate;
    if (min === null || candidate.weightKg <= min.weightKg) min = candidate;
  }

  if (max === null || min === null) return null;
  return { max, min: min.weightKg === max.weightKg ? null : min };
}
