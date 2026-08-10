import { db, type ApneaSession } from "../db/schema";

export async function addApneaSession(
  date: string,
  durationSec: number,
  time?: string
): Promise<void> {
  await db.apneaSessions.add({ date, durationSec, time });
}

export async function deleteApneaSession(id: number): Promise<void> {
  await db.apneaSessions.delete(id);
}

export async function getAllApneaSessions(): Promise<ApneaSession[]> {
  return db.apneaSessions.orderBy("date").reverse().toArray();
}

export async function getApneaSessionsBetween(
  startDate: string,
  endDate: string
): Promise<ApneaSession[]> {
  return db.apneaSessions.where("date").between(startDate, endDate, true, true).toArray();
}

/** Les sessions des `days` derniers jours (incluant aujourd'hui), triées par date décroissante. */
export async function getRecentApneaSessions(startDate: string): Promise<ApneaSession[]> {
  const sessions = await db.apneaSessions.where("date").aboveOrEqual(startDate).sortBy("date");
  return sessions.reverse();
}
