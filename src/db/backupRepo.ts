import { db, type WeightEntry, type DailyLog, type ApneaSession, type WeightGoal } from "./schema";

const BACKUP_VERSION = 1;

export interface BackupData {
  version: number;
  exportedAt: string;
  weightEntries: WeightEntry[];
  dailyLogs: DailyLog[];
  apneaSessions: ApneaSession[];
  weightGoals: WeightGoal[];
}

/** Sérialise toutes les tables en un objet exportable en JSON. */
export async function exportAllData(): Promise<BackupData> {
  const [weightEntries, dailyLogs, apneaSessions, weightGoals] = await Promise.all([
    db.weightEntries.toArray(),
    db.dailyLogs.toArray(),
    db.apneaSessions.toArray(),
    db.weightGoals.toArray(),
  ]);
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    weightEntries,
    dailyLogs,
    apneaSessions,
    weightGoals,
  };
}

/** Vérifie qu'un objet quelconque a bien la forme d'un fichier de sauvegarde valide. */
export function isValidBackupData(data: unknown): data is BackupData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.weightEntries) &&
    Array.isArray(d.dailyLogs) &&
    Array.isArray(d.apneaSessions) &&
    Array.isArray(d.weightGoals)
  );
}

/**
 * Remplace entièrement les données locales par celles du fichier importé :
 * vide les quatre tables puis restaure leur contenu, dans une transaction
 * pour éviter un état à moitié importé en cas d'erreur en cours de route.
 */
export async function importAllData(data: BackupData): Promise<void> {
  await db.transaction("rw", db.weightEntries, db.dailyLogs, db.apneaSessions, db.weightGoals, async () => {
    await Promise.all([
      db.weightEntries.clear(),
      db.dailyLogs.clear(),
      db.apneaSessions.clear(),
      db.weightGoals.clear(),
    ]);
    await Promise.all([
      db.weightEntries.bulkAdd(data.weightEntries),
      db.dailyLogs.bulkAdd(data.dailyLogs),
      db.apneaSessions.bulkAdd(data.apneaSessions),
      db.weightGoals.bulkAdd(data.weightGoals),
    ]);
  });
}