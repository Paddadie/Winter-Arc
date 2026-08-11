import { daysBetween } from "../utils/date";
import type { WeightGoal } from "../db/schema";

/**
 * Poids théorique attendu à une date donnée, selon une trajectoire linéaire
 * entre le poids de départ (à startDate) et le poids cible (à targetDate).
 * Retourne null si la date est hors de la plage [startDate, targetDate]
 * n'a pas vraiment de sens de l'extrapoler indéfiniment... mais en pratique
 * on clamp plutôt que de retourner null, pour que le graphique reste continu
 * avant/après la période (voir clamp ci-dessous).
 */
export function theoreticalWeightAt(goal: WeightGoal, date: string): number {
  const totalDays = daysBetween(goal.startDate, goal.targetDate);
  const elapsedDays = daysBetween(goal.startDate, date);

  if (totalDays <= 0) {
    // Date cible pas après la date de départ : pas de trajectoire possible,
    // on retourne simplement l'objectif.
    return goal.targetWeightKg;
  }

  // Clamp : avant le départ → poids de départ ; après la cible → poids cible.
  const progress = Math.min(1, Math.max(0, elapsedDays / totalDays));
  return goal.startWeightKg + (goal.targetWeightKg - goal.startWeightKg) * progress;
}

/** Nombre de kg restants pour atteindre l'objectif, depuis le dernier poids connu. */
export function remainingKg(goal: WeightGoal, currentWeightKg: number): number {
  return Math.round((currentWeightKg - goal.targetWeightKg) * 10) / 10;
}

/** Nombre de jours restants jusqu'à la date cible (peut être négatif si dépassée). */
export function daysRemaining(goal: WeightGoal, todayIso: string): number {
  return daysBetween(todayIso, goal.targetDate);
}
