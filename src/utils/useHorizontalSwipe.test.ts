import { describe, expect, it } from "vitest";
import { swipeDirection } from "./useHorizontalSwipe";

describe("swipeDirection", () => {
  it("reconnaît un balayage franc dans chaque sens", () => {
    expect(swipeDirection(-90, 0)).toBe("left");
    expect(swipeDirection(90, 0)).toBe("right");
  });

  it("ignore un geste trop court", () => {
    // Un simple tap tremblé ne doit pas changer de jour.
    expect(swipeDirection(-40, 0)).toBeNull();
    expect(swipeDirection(0, 0)).toBeNull();
  });

  it("ignore un geste surtout vertical", () => {
    // Doigt qui descend pour lire la suite de la fiche : pas une navigation.
    expect(swipeDirection(-70, 120)).toBeNull();
  });

  it("accepte un balayage horizontal légèrement oblique", () => {
    expect(swipeDirection(-90, 30)).toBe("left");
  });
});
