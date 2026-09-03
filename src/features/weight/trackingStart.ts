import { todayISO } from "../../utils/date";
import type { WeightEntry, WeightGoal } from "../../db/schema";

/**
 * Premier jour de suivi : le plus ancien entre le début de l'objectif et la
 * première pesée. Sert à la fois de borne gauche de l'historique et de point
 * de départ du remplissage des journaux passés — au-delà, les jours n'ont
 * jamais été « non renseignés », l'application n'existait pas encore pour
 * l'utilisateur.
 *
 * Aujourd'hui si rien n'est encore enregistré : il n'y a alors aucun passé à
 * couvrir.
 */
export function trackingStartDate(goal: WeightGoal | null, entries: WeightEntry[]): string {
  const candidates = [goal?.startDate, entries[0]?.date].filter((date): date is string => date != null);
  if (candidates.length === 0) return todayISO();
  return candidates.reduce((earliest, date) => (date < earliest ? date : earliest));
}
