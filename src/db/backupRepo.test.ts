import { describe, expect, it } from "vitest";
import { isValidBackupData } from "./backupRepo";

/** Sauvegarde minimale mais complète, telle que la produit exportAllData. */
function validBackup(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    exportedAt: "2026-08-31T10:00:00.000Z",
    weightEntries: [{ id: 1, date: "2026-08-30", weightKg: 84.2 }],
    dailyLogs: [{ id: 1, date: "2026-08-30", sport: true, foodDeviation: false, period: false }],
    apneaSessions: [{ id: 1, date: "2026-08-30", time: "09:12", durationSec: 135 }],
    weightGoals: [
      {
        id: 1,
        startWeightKg: 90,
        startDate: "2026-01-01",
        targetWeightKg: 80,
        targetDate: "2026-12-31",
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("isValidBackupData", () => {
  it("accepte un export complet", () => {
    expect(isValidBackupData(validBackup())).toBe(true);
  });

  it("accepte des tables vides", () => {
    expect(
      isValidBackupData({ weightEntries: [], dailyLogs: [], apneaSessions: [], weightGoals: [] })
    ).toBe(true);
  });

  // Les champs optionnels (period, time) manquent dans les enregistrements
  // créés avant leur introduction : un vieil export doit rester restaurable.
  it("accepte un enregistrement sans ses champs optionnels", () => {
    expect(
      isValidBackupData(
        validBackup({
          dailyLogs: [{ date: "2026-08-30", sport: false, foodDeviation: false }],
          apneaSessions: [{ date: "2026-08-30", durationSec: 60 }],
        })
      )
    ).toBe(true);
  });

  it("rejette ce qui n'est pas un objet", () => {
    expect(isValidBackupData(null)).toBe(false);
    expect(isValidBackupData("texte")).toBe(false);
    expect(isValidBackupData([])).toBe(false);
  });

  it("rejette un fichier auquel il manque une table", () => {
    const { weightGoals, ...withoutGoals } = validBackup();
    expect(weightGoals).toBeDefined();
    expect(isValidBackupData(withoutGoals)).toBe(false);
  });

  // Le cas qui motive toute cette validation : l'import efface définitivement
  // les données de l'appareil, un JSON étranger ne doit jamais passer.
  it("rejette quatre tableaux au contenu étranger", () => {
    expect(
      isValidBackupData({
        weightEntries: [{ foo: "bar" }],
        dailyLogs: [],
        apneaSessions: [],
        weightGoals: [],
      })
    ).toBe(false);
  });

  it("rejette un champ du mauvais type", () => {
    expect(isValidBackupData(validBackup({ weightEntries: [{ date: "2026-08-30", weightKg: "84.2" }] }))).toBe(false);
    expect(
      isValidBackupData(validBackup({ dailyLogs: [{ date: "2026-08-30", sport: "oui", foodDeviation: false }] }))
    ).toBe(false);
  });

  it("rejette un tableau contenant autre chose que des objets", () => {
    expect(isValidBackupData(validBackup({ apneaSessions: [null] }))).toBe(false);
    expect(isValidBackupData(validBackup({ apneaSessions: ["2026-08-30"] }))).toBe(false);
  });

  it("rejette un export produit par une version plus récente", () => {
    expect(isValidBackupData(validBackup({ version: 2 }))).toBe(false);
  });

  it("accepte un export sans numéro de version", () => {
    const { version, ...withoutVersion } = validBackup();
    expect(version).toBe(1);
    expect(isValidBackupData(withoutVersion)).toBe(true);
  });
});
