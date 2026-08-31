import { describe, expect, it } from "vitest";
import { buildReminderLabel } from "./featureReminder";
import type { FeatureReminderConfig } from "./features.config";

const config: FeatureReminderConfig = { afterDays: 2, noun: "pesée", neverLabel: "Aucune pesée" };

describe("buildReminderLabel", () => {
  it("signale une fonctionnalité jamais utilisée", () => {
    expect(buildReminderLabel(config, null, "2026-08-31")).toBe("Aucune pesée");
  });

  it("ne dit rien le jour même ni la veille", () => {
    expect(buildReminderLabel(config, "2026-08-31", "2026-08-31")).toBeNull();
    expect(buildReminderLabel(config, "2026-08-30", "2026-08-31")).toBeNull();
  });

  it("se déclenche à partir du seuil", () => {
    expect(buildReminderLabel(config, "2026-08-29", "2026-08-31")).toBe("2 jours sans pesée");
    expect(buildReminderLabel(config, "2026-08-21", "2026-08-31")).toBe("10 jours sans pesée");
  });

  it("respecte un seuil propre à chaque fonctionnalité", () => {
    const apnea: FeatureReminderConfig = { afterDays: 3, noun: "mesure", neverLabel: "Aucune mesure" };
    expect(buildReminderLabel(apnea, "2026-08-29", "2026-08-31")).toBeNull();
    expect(buildReminderLabel(apnea, "2026-08-28", "2026-08-31")).toBe("3 jours sans mesure");
  });

  // Une date future ne doit pas produire un rappel à nombre négatif, même si
  // le cas ne devrait pas se présenter (saisie sur un jour à venir).
  it("ne dit rien pour une dernière activité dans le futur", () => {
    expect(buildReminderLabel(config, "2026-09-05", "2026-08-31")).toBeNull();
  });
});
