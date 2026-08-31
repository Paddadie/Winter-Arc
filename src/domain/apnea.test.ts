import { describe, expect, it } from "vitest";
import { computeWindowStats, formatDuration, formatDurationWithMs, groupDailyBest } from "./apnea";
import type { ApneaSession } from "../db/schema";

function sessions(...triples: [string, number][]): ApneaSession[] {
  return triples.map(([date, durationSec], i) => ({ id: i + 1, date, durationSec }));
}

describe("formatDuration", () => {
  it("formate en MM:SS sur deux chiffres", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(9)).toBe("00:09");
    expect(formatDuration(135)).toBe("02:15");
    expect(formatDuration(600)).toBe("10:00");
  });

  it("ne repasse pas à zéro au-delà d'une heure", () => {
    expect(formatDuration(3661)).toBe("61:01");
  });
});

describe("formatDurationWithMs", () => {
  it("formate en MM:SS:cc", () => {
    expect(formatDurationWithMs(0)).toBe("00:00:00");
    expect(formatDurationWithMs(1234)).toBe("00:01:23");
    expect(formatDurationWithMs(135_990)).toBe("02:15:99");
  });

  it("tronque les centièmes au lieu de les arrondir", () => {
    // Un chrono ne doit jamais afficher une valeur supérieure au temps écoulé.
    expect(formatDurationWithMs(1999)).toBe("00:01:99");
  });
});

describe("groupDailyBest", () => {
  it("retourne un tableau vide sans session", () => {
    expect(groupDailyBest([])).toEqual([]);
  });

  it("garde la meilleure performance de chaque jour, pas la moyenne", () => {
    const points = groupDailyBest(sessions(["2026-01-01", 60], ["2026-01-01", 120], ["2026-01-01", 30]));
    expect(points).toEqual([{ date: "2026-01-01", durationSec: 120, count: 3 }]);
  });

  it("compte le nombre de mesures du jour", () => {
    const points = groupDailyBest(sessions(["2026-01-01", 60], ["2026-01-02", 90], ["2026-01-02", 80]));
    expect(points.map((p) => p.count)).toEqual([1, 2]);
  });

  it("conserve l'ordre des jours de l'entrée", () => {
    const points = groupDailyBest(sessions(["2026-01-01", 60], ["2026-01-02", 90], ["2026-01-03", 70]));
    expect(points.map((p) => p.date)).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
  });
});

describe("computeWindowStats", () => {
  it("retourne null sans session", () => {
    expect(computeWindowStats([])).toBeNull();
  });

  it("calcule moyenne, pire et meilleure avec leur date", () => {
    const stats = computeWindowStats(sessions(["2026-01-01", 60], ["2026-01-02", 120], ["2026-01-03", 90]));
    expect(stats).toEqual({
      averageSec: 90,
      worst: { durationSec: 60, date: "2026-01-01" },
      best: { durationSec: 120, date: "2026-01-02" },
    });
  });

  it("arrondit la moyenne à la seconde", () => {
    expect(computeWindowStats(sessions(["2026-01-01", 60], ["2026-01-02", 61]))!.averageSec).toBe(61);
    expect(computeWindowStats(sessions(["2026-01-01", 10], ["2026-01-02", 11]))!.averageSec).toBe(11);
  });

  // La moyenne porte sur TOUTES les séances brutes, sans regroupement par jour :
  // trois séances le même jour pèsent trois fois dans la moyenne.
  it("moyenne les séances brutes, pas les jours", () => {
    const stats = computeWindowStats(sessions(["2026-01-01", 30], ["2026-01-01", 30], ["2026-01-02", 120]));
    expect(stats!.averageSec).toBe(60);
  });

  it("gère une session unique", () => {
    const stats = computeWindowStats(sessions(["2026-01-01", 75]));
    expect(stats).toEqual({
      averageSec: 75,
      worst: { durationSec: 75, date: "2026-01-01" },
      best: { durationSec: 75, date: "2026-01-01" },
    });
  });

  it("retient la première occurrence en cas d'égalité", () => {
    const stats = computeWindowStats(sessions(["2026-01-01", 60], ["2026-01-02", 60]));
    expect(stats!.worst.date).toBe("2026-01-01");
    expect(stats!.best.date).toBe("2026-01-01");
  });
});
