import { describe, expect, it } from "vitest";
import { buildWeightSeries } from "./weightSeries";
import type { DailyLog, WeightEntry, WeightGoal } from "../db/schema";

function entries(...pairs: [string, number][]): WeightEntry[] {
  return pairs.map(([date, weightKg]) => ({ date, weightKg }));
}

const goal: WeightGoal = {
  startWeightKg: 90,
  startDate: "2026-01-01",
  targetWeightKg: 80,
  targetDate: "2026-01-11",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("buildWeightSeries", () => {
  it("produit un point par jour, bornes incluses", () => {
    const series = buildWeightSeries([], null, "2026-01-01", "2026-01-05");
    expect(series.map((p) => p.date)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
    ]);
  });

  it("produit un seul point quand début et fin sont identiques", () => {
    expect(buildWeightSeries([], null, "2026-01-01", "2026-01-01")).toHaveLength(1);
  });

  it("marque les pesées réelles et les distingue des estimations", () => {
    const series = buildWeightSeries(entries(["2026-01-01", 90], ["2026-01-03", 88]), null, "2026-01-01", "2026-01-03");
    expect(series.map((p) => [p.weightKg, p.isReal])).toEqual([
      [90, true],
      [89, false],
      [88, true],
    ]);
  });

  it("arrondit les valeurs interpolées au dixième", () => {
    const series = buildWeightSeries(entries(["2026-01-01", 90], ["2026-01-04", 89]), null, "2026-01-02", "2026-01-02");
    expect(series[0].weightKg).toBe(89.7);
  });

  // On ne fabrique pas de données hors de la plage mesurée : mieux vaut un
  // trou dans la courbe qu'une valeur inventée.
  it("laisse null avant la première et après la dernière pesée", () => {
    const series = buildWeightSeries(entries(["2026-01-03", 88]), null, "2026-01-01", "2026-01-05");
    expect(series.map((p) => p.weightKg)).toEqual([null, null, 88, null, null]);
  });

  it("interpole en s'appuyant sur des pesées situées hors de la fenêtre", () => {
    const series = buildWeightSeries(
      entries(["2025-12-30", 90], ["2026-01-04", 85]),
      null,
      "2026-01-01",
      "2026-01-02"
    );
    // 5 jours entre les deux pesées pour -5 kg, soit -1 kg/jour.
    expect(series.map((p) => p.weightKg)).toEqual([88, 87]);
  });

  it("ne dépend pas de l'ordre des pesées en entrée", () => {
    const ordered = buildWeightSeries(entries(["2026-01-01", 90], ["2026-01-05", 86]), null, "2026-01-01", "2026-01-05");
    const shuffled = buildWeightSeries(entries(["2026-01-05", 86], ["2026-01-01", 90]), null, "2026-01-01", "2026-01-05");
    expect(shuffled).toEqual(ordered);
  });

  it("calcule le poids théorique quand un objectif existe", () => {
    const series = buildWeightSeries([], goal, "2026-01-01", "2026-01-03");
    expect(series.map((p) => p.goalWeightKg)).toEqual([90, 89, 88]);
  });

  it("laisse le poids théorique à null sans objectif", () => {
    const series = buildWeightSeries([], null, "2026-01-01", "2026-01-02");
    expect(series.every((p) => p.goalWeightKg === null)).toBe(true);
  });

  describe("journal tri-état", () => {
    const logs: DailyLog[] = [
      { date: "2026-01-02", sport: true, foodDeviation: false, period: true },
      { date: "2026-01-03", sport: false, foodDeviation: true },
    ];

    it("distingue « non renseigné » de « renseigné à non »", () => {
      const series = buildWeightSeries([], null, "2026-01-01", "2026-01-03", logs);
      expect(series.map((p) => p.sport)).toEqual([null, true, false]);
      expect(series.map((p) => p.foodDeviation)).toEqual([null, false, true]);
    });

    it("traite un cycle absent de l'enregistrement comme non renseigné", () => {
      const series = buildWeightSeries([], null, "2026-01-01", "2026-01-03", logs);
      expect(series.map((p) => p.period)).toEqual([null, true, null]);
    });
  });

  describe("tendance", () => {
    it("est nulle partout en dessous de deux pesées", () => {
      const series = buildWeightSeries(entries(["2026-01-01", 90]), null, "2026-01-01", "2026-01-03");
      expect(series.every((p) => p.trendWeightKg === null)).toBe(true);
    });

    it("couvre toute la fenêtre, y compris les jours sans pesée", () => {
      const series = buildWeightSeries(entries(["2026-01-01", 90], ["2026-01-03", 88]), null, "2026-01-01", "2026-01-05");
      expect(series.map((p) => p.trendWeightKg)).toEqual([90, 89, 88, 87, 86]);
    });

    // Non arrondie, contrairement aux autres poids : sur une pente faible,
    // l'arrondi au dixième transformerait la droite en escalier.
    it("n'est pas arrondie au dixième", () => {
      const series = buildWeightSeries(entries(["2026-01-01", 90], ["2026-01-10", 89.5]), null, "2026-01-02", "2026-01-02");
      expect(series[0].trendWeightKg).toBeCloseTo(89.944, 3);
    });
  });
});
