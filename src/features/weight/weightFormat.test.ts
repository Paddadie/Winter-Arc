import { describe, expect, it } from "vitest";
import { formatKg, formatKgValue, formatSignedKg } from "./weightFormat";

describe("formatKgValue", () => {
  it("affiche une décimale avec une virgule", () => {
    expect(formatKgValue(84)).toBe("84,0");
    expect(formatKgValue(84.25)).toBe("84,3");
    expect(formatKgValue(84.24)).toBe("84,2");
  });
});

describe("formatKg", () => {
  it("ajoute l'unité", () => {
    expect(formatKg(84.2)).toBe("84,2 kg");
  });
});

describe("formatSignedKg", () => {
  it("préfixe les écarts positifs d'un +", () => {
    expect(formatSignedKg(0.3)).toBe("+0,3 kg");
  });

  it("garde le signe des écarts négatifs", () => {
    expect(formatSignedKg(-0.3)).toBe("-0,3 kg");
  });

  it("n'affiche pas de signe sur un écart nul", () => {
    expect(formatSignedKg(0)).toBe("0,0 kg");
  });

  // Math.round(-0.4) vaut -0 en JavaScript, et (-0).toFixed(1) donnerait "-0.0".
  it("normalise le zéro négatif", () => {
    expect(formatSignedKg(-0)).toBe("0,0 kg");
    expect(formatSignedKg(Math.round(-0.4) / 10)).toBe("0,0 kg");
  });
});
