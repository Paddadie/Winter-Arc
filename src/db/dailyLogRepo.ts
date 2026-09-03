import { db, type DailyLog } from "../db/schema";
import { missingDatesInRange } from "../utils/date";

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

/**
 * Crée un journal « rien à signaler » pour chaque jour PASSÉ qui n'en a pas
 * encore, entre `fromDate` et `throughDate` (bornes incluses).
 *
 * Règle posée par l'utilisateur : un jour révolu sans saisie signifie qu'il
 * n'y a eu ni sport ni écart, pas qu'on l'ignore. La base doit donc contenir
 * `false`, et pas l'absence d'enregistrement — sinon la même journée se lit
 * différemment selon qu'on l'a ouverte ou non.
 *
 * `throughDate` doit rester la VEILLE : la journée en cours n'est pas finie,
 * son absence de saisie ne veut encore rien dire. `period` est volontairement
 * omis (et non posé à `false`) : rien n'autorise à déclarer l'absence de
 * règles un jour où la question n'a pas été posée.
 *
 * Idempotent : rappelé à chaque chargement, il ne comble que les jours
 * nouvellement passés. Retourne le nombre de journaux créés.
 */
export async function backfillPastDailyLogs(fromDate: string, throughDate: string): Promise<number> {
  if (fromDate > throughDate) return 0;

  const existing = await db.dailyLogs.where("date").between(fromDate, throughDate, true, true).toArray();
  const missing = missingDatesInRange(
    existing.map((log) => log.date),
    fromDate,
    throughDate
  );
  if (missing.length === 0) return 0;

  await db.dailyLogs.bulkAdd(missing.map((date) => ({ date, sport: false, foodDeviation: false })));
  return missing.length;
}
