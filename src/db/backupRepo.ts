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

/**
 * Vérifie qu'un objet quelconque a bien la forme d'un fichier de sauvegarde.
 *
 * Le contrôle descend jusqu'aux champs de chaque enregistrement, et pas
 * seulement à la présence des quatre tableaux : l'import efface DÉFINITIVEMENT
 * toutes les données de l'appareil, un fichier au mauvais format doit donc
 * être refusé avant, pas constaté après.
 */
export function isValidBackupData(data: unknown): data is BackupData {
  if (!isRecord(data)) return false;

  // Un export produit par une version plus récente peut contenir des tables
  // ou des champs que cette version ne sait pas restaurer : on refuse plutôt
  // que d'importer partiellement.
  if (typeof data.version === "number" && data.version > BACKUP_VERSION) return false;

  return (
    isArrayOf(data.weightEntries, isWeightEntry) &&
    isArrayOf(data.dailyLogs, isDailyLog) &&
    isArrayOf(data.apneaSessions, isApneaSession) &&
    isArrayOf(data.weightGoals, isWeightGoal)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isArrayOf(value: unknown, isItem: (item: Record<string, unknown>) => boolean): boolean {
  return Array.isArray(value) && value.every((item) => isRecord(item) && isItem(item));
}

function isWeightEntry(item: Record<string, unknown>): boolean {
  return typeof item.date === "string" && typeof item.weightKg === "number";
}

function isDailyLog(item: Record<string, unknown>): boolean {
  return typeof item.date === "string" && typeof item.sport === "boolean" && typeof item.foodDeviation === "boolean";
}

function isApneaSession(item: Record<string, unknown>): boolean {
  return typeof item.date === "string" && typeof item.durationSec === "number";
}

function isWeightGoal(item: Record<string, unknown>): boolean {
  return (
    typeof item.startWeightKg === "number" &&
    typeof item.startDate === "string" &&
    typeof item.targetWeightKg === "number" &&
    typeof item.targetDate === "string" &&
    typeof item.active === "boolean"
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