import { describe, expect, it } from "vitest";
import { daysRemaining, remainingKg, theoreticalWeightAt } from "./weightTrajectory";
import type { WeightGoal } from "../db/schema";

function makeGoal(overrides: Partial<WeightGoal> = {}): WeightGoal {
  return {
    startWeightKg: 90,
    startDate: "2026-01-01",
    targetWeightKg: 80,
    targetDate: "2026-01-11", // 10 jours, soit exactement -1 kg/jour
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("theoreticalWeightAt", () => {
  it("vaut le poids de départ à la date de départ", () => {
    expect(theoreticalWeightAt(makeGoal(), "2026-01-01")).toBe(90);
  });

  it("vaut le poids cible à la date cible", () => {
    expect(theoreticalWeightAt(makeGoal(), "2026-01-11")).toBe(80);
  });

  it("interpole linéairement entre les deux", () => {
    expect(theoreticalWeightAt(makeGoal(), "2026-01-06")).toBe(85);
    expect(theoreticalWeightAt(makeGoal(), "2026-01-03")).toBe(88);
  });

  // Le graphique affiche quelques jours avant et après la période : la
  // trajectoire doit rester continue au lieu de disparaître aux bords.
  it("est bornée avant le départ et après la cible", () => {
    expect(theoreticalWeightAt(makeGoal(), "2025-12-01")).toBe(90);
    expect(theoreticalWeightAt(makeGoal(), "2027-01-01")).toBe(80);
  });

  it("retourne l'objectif si la cible n'est pas après le départ", () => {
    const sameDay = makeGoal({ targetDate: "2026-01-01" });
    expect(theoreticalWeightAt(sameDay, "2026-01-01")).toBe(80);

    const inverted = makeGoal({ targetDate: "2025-12-01" });
    expect(theoreticalWeightAt(inverted, "2026-01-01")).toBe(80);
  });

  it("gère aussi une prise de poids", () => {
    const gain = makeGoal({ startWeightKg: 60, targetWeightKg: 70 });
    expect(theoreticalWeightAt(gain, "2026-01-06")).toBe(65);
  });
});

describe("remainingKg", () => {
  it("compte les kilos restants, arrondis au dixième", () => {
    expect(remainingKg(makeGoal(), 85)).toBe(5);
    expect(remainingKg(makeGoal(), 82.34)).toBe(2.3);
  });

  it("devient négatif une fois l'objectif dépassé", () => {
    expect(remainingKg(makeGoal(), 78.5)).toBe(-1.5);
  });
});

describe("daysRemaining", () => {
  it("compte les jours jusqu'à la cible", () => {
    expect(daysRemaining(makeGoal(), "2026-01-01")).toBe(10);
    expect(daysRemaining(makeGoal(), "2026-01-11")).toBe(0);
  });

  it("devient négatif une fois l'échéance passée", () => {
    expect(daysRemaining(makeGoal(), "2026-01-15")).toBe(-4);
  });
});
