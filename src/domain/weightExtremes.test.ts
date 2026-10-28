import { describe, expect, it } from "vitest";
import { findWeightExtremes } from "./weightExtremes";
import type { WeightSeriesPoint } from "./weightSeries";

function point(date: string, weightKg: number | null, isReal = true): WeightSeriesPoint {
  return { date, weightKg, isReal, goalWeightKg: null, sport: null, foodDeviation: null, period: null, trendWeightKg: null };
}

describe("findWeightExtremes", () => {
  it("renvoie null sans aucune pesée", () => {
    expect(findWeightExtremes([])).toBeNull();
    expect(findWeightExtremes([point("2026-01-01", null), point("2026-01-02", 80, false)])).toBeNull();
  });

  it("trouve le max et le min", () => {
    const result = findWeightExtremes([point("2026-01-01", 82), point("2026-01-02", 84.5), point("2026-01-03", 81.2)]);
    expect(result).toEqual({
      max: { date: "2026-01-02", weightKg: 84.5 },
      min: { date: "2026-01-03", weightKg: 81.2 },
    });
  });

  it("ignore les jours interpolés", () => {
    const result = findWeightExtremes([point("2026-01-01", 82), point("2026-01-02", 99, false), point("2026-01-03", 81)]);
    expect(result?.max.weightKg).toBe(82);
  });

  it("n'a pas de min pour une pesée unique", () => {
    expect(findWeightExtremes([point("2026-01-01", 80)])).toEqual({
      max: { date: "2026-01-01", weightKg: 80 },
      min: null,
    });
  });

  it("n'a pas de min quand tous les poids sont égaux", () => {
    expect(findWeightExtremes([point("2026-01-01", 80), point("2026-01-02", 80)])?.min).toBeNull();
  });

  it("garde la pesée la plus récente en cas d'égalité", () => {
    const result = findWeightExtremes([
      point("2026-01-01", 85),
      point("2026-01-02", 80),
      point("2026-01-03", 85),
      point("2026-01-04", 80),
    ]);
    expect(result?.max.date).toBe("2026-01-03");
    expect(result?.min?.date).toBe("2026-01-04");
  });
});
