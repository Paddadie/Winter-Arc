import { db, type WeightEntry } from "../db/schema";

/** Ajoute un poids. S'il existe déjà une mesure ce jour-là, elle est remplacée. */
export async function addWeightEntry(date: string, weightKg: number): Promise<void> {
  const existing = await db.weightEntries.where("date").equals(date).first();
  if (existing) {
    await db.weightEntries.update(existing.id!, { weightKg });
  } else {
    await db.weightEntries.add({ date, weightKg });
  }
}

/** Toutes les entrées, triées par date croissante. */
export async function getAllWeightEntries(): Promise<WeightEntry[]> {
  return db.weightEntries.orderBy("date").toArray();
}

/** Entrées comprises entre deux dates ISO (bornes incluses). */
export async function getWeightEntriesBetween(
  startDate: string,
  endDate: string
): Promise<WeightEntry[]> {
  return db.weightEntries.where("date").between(startDate, endDate, true, true).toArray();
}

/** Dernière mesure enregistrée, ou null si aucune donnée. */
export async function getLatestWeightEntry(): Promise<WeightEntry | null> {
  const entries = await db.weightEntries.orderBy("date").reverse().limit(1).toArray();
  return entries[0] ?? null;
}
