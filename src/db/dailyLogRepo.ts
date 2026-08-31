import { db, type DailyLog } from "../db/schema";

/**
 * Crée ou met à jour le log du jour (une seule entrée par date).
 *
 * À la création, les champs absents du patch sont posés à `false` et non
 * laissés indéfinis : c'est la contrainte assumée du modèle tri-état — dès
 * qu'on touche une puce d'un jour, les autres passent de "non renseigné" à
 * "non". Distinguer les trois états par champ demanderait un champ optionnel
 * par puce, complexité non justifiée pour l'usage.
 */
export async function setDailyLog(
  date: string,
  patch: Partial<Pick<DailyLog, "sport" | "foodDeviation" | "period">>
): Promise<void> {
  const existing = await db.dailyLogs.where("date").equals(date).first();
  if (existing) {
    await db.dailyLogs.update(existing.id!, patch);
  } else {
    await db.dailyLogs.add({
      date,
      sport: patch.sport ?? false,
      foodDeviation: patch.foodDeviation ?? false,
      period: patch.period ?? false,
    });
  }
}

export async function getDailyLog(date: string): Promise<DailyLog | null> {
  const log = await db.dailyLogs.where("date").equals(date).first();
  return log ?? null;
}

export async function getDailyLogsBetween(
  startDate: string,
  endDate: string
): Promise<DailyLog[]> {
  return db.dailyLogs.where("date").between(startDate, endDate, true, true).toArray();
}
