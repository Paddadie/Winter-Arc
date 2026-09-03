import { describe, expect, it } from "vitest";
import { computeWeightTrend, trendWeightAt } from "./weightTrend";
import type { WeightEntry } from "../db/schema";

function entries(...pairs: [string, number][]): WeightEntry[] {
  return pairs.map(([date, weightKg]) => ({ date, weightKg }));
}

describe("computeWeightTrend", () => {
  it("retourne null en dessous de deux pesées", () => {
    expect(computeWeightTrend([])).toBeNull();
    expect(computeWeightTrend(entries(["2026-01-01", 90]))).toBeNull();
  });

  it("retourne null si toutes les pesées tombent le même jour", () => {
    expect(computeWeightTrend(entries(["2026-01-01", 90], ["2026-01-01", 89]))).toBeNull();
  });

  it("retourne null quand une seule pesée tombe dans la fenêtre de quatorze jours", () => {
    // Les pesées plus anciennes ne peuvent pas rattraper une fenêtre trop vide :
    // elles décriraient une dynamique qui n'a plus cours.
    expect(computeWeightTrend(entries(["2026-01-01", 90], ["2026-02-01", 88]))).toBeNull();
  });

  it("retrouve exactement une droite parfaite", () => {
    const trend = computeWeightTrend(entries(["2026-01-01", 90], ["2026-01-03", 89], ["2026-01-05", 88]));
    expect(trend).not.toBeNull();
    expect(trend!.slopeKgPerDay).toBeCloseTo(-0.5, 10);
    expect(trend!.interceptKg).toBeCloseTo(90, 10);
    expect(trend!.originDate).toBe("2026-01-01");
  });

  it("lisse le bruit autour de la droite", () => {
    // Symétrique autour de la droite y = 90 - 0,5x : les écarts se compensent.
    const trend = computeWeightTrend(entries(["2026-01-01", 90.5], ["2026-01-03", 89], ["2026-01-05", 87.5]));
    expect(trend!.slopeKgPerDay).toBeCloseTo(-0.75, 10);
  });

  it("ignore les pesées antérieures aux quatorze derniers jours de mesure", () => {
    // Sans fenêtre, la chute de 100 à 90 kg de janvier écraserait la pente
    // réelle des deux dernières semaines.
    const trend = computeWeightTrend(entries(["2026-01-01", 100], ["2026-02-01", 90], ["2026-02-11", 88]))!;
    expect(trend.originDate).toBe("2026-02-01");
    expect(trend.slopeKgPerDay).toBeCloseTo(-0.2, 10);
    expect(trend.interceptKg).toBeCloseTo(90, 10);
  });

  it("garde la pesée qui ouvre la fenêtre et écarte celle qui la précède", () => {
    // Fenêtre de 14 jours bornes incluses : ancrée sur le 14, elle commence le 1er.
    const trend = computeWeightTrend(entries(["2025-12-31", 100], ["2026-01-01", 90], ["2026-01-14", 77]))!;
    expect(trend.originDate).toBe("2026-01-01");
    expect(trend.slopeKgPerDay).toBeCloseTo(-1, 10);
  });

  it("ancre la fenêtre sur la dernière pesée, même ancienne", () => {
    // Plusieurs semaines sans se peser : on montre encore la tendance des
    // deux dernières semaines de mesure plutôt que plus rien du tout.
    const trend = computeWeightTrend(entries(["2025-06-01", 90], ["2025-06-11", 88]))!;
    expect(trend.originDate).toBe("2025-06-01");
    expect(trend.slopeKgPerDay).toBeCloseTo(-0.2, 10);
  });

  it("ne dépend pas de l'ordre des pesées en entrée", () => {
    const ordered = computeWeightTrend(entries(["2026-01-01", 90], ["2026-01-05", 88]));
    const shuffled = computeWeightTrend(entries(["2026-01-05", 88], ["2026-01-01", 90]));
    expect(shuffled).toEqual(ordered);
  });

  it("donne une pente positive sur une prise de poids", () => {
    const trend = computeWeightTrend(entries(["2026-01-01", 80], ["2026-01-11", 82]));
    expect(trend!.slopeKgPerDay).toBeCloseTo(0.2, 10);
  });
});

describe("trendWeightAt", () => {
  it("prolonge la droite avant et après la période mesurée", () => {
    const trend = computeWeightTrend(entries(["2026-01-01", 90], ["2026-01-11", 80]))!;
    expect(trendWeightAt(trend, "2026-01-06")).toBeCloseTo(85, 10);
    // Extrapolation volontaire dans les deux sens : la droite traverse toute
    // la largeur du graphique, sans jamais s'interrompre en cours de route.
    expect(trendWeightAt(trend, "2026-01-21")).toBeCloseTo(70, 10);
    expect(trendWeightAt(trend, "2025-12-31")).toBeCloseTo(91, 10);
  });
});
