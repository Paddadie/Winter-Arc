import { db, type DailyLog } from "../db/schema";

/** Crée ou met à jour le log du jour (une seule entrée par date). */
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
