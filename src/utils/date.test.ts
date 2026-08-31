import { describe, expect, it, vi, afterEach } from "vitest";
import {
  addDays,
  daysBetween,
  formatDayMonth,
  formatDurationLabel,
  isWeekend,
  nowTimeHHMM,
  parseISODate,
  relativeDayLabel,
  toISODate,
  todayISO,
} from "./date";

afterEach(() => {
  vi.useRealTimers();
});

/** Fige l'horloge sur une date/heure locale précise. */
function freezeLocalDate(year: number, month: number, day: number, hour = 12) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(year, month - 1, day, hour));
}

describe("parseISODate", () => {
  it("interprète la date en heure locale, pas en UTC", () => {
    const date = parseISODate("2026-08-11");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(11);
    expect(date.getHours()).toBe(0);
  });
});

describe("toISODate", () => {
  it("complète le mois et le jour sur deux chiffres", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("todayISO", () => {
  it("retourne le jour local courant", () => {
    freezeLocalDate(2026, 8, 31, 23);
    expect(todayISO()).toBe("2026-08-31");
  });
});

describe("addDays", () => {
  it("avance et recule d'un nombre de jours", () => {
    expect(addDays("2026-08-11", 1)).toBe("2026-08-12");
    expect(addDays("2026-08-11", -1)).toBe("2026-08-10");
    expect(addDays("2026-08-11", 0)).toBe("2026-08-11");
  });

  it("franchit les fins de mois et d'année", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("gère le 29 février d'une année bissextile", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
  });

  // Le 29 mars 2026, la France passe à l'heure d'été : la journée ne fait que
  // 23 h. Un calcul en millisecondes sans repasser par le calendrier local
  // ferait dériver la date.
  it("reste juste au passage à l'heure d'été", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
  });
});

describe("daysBetween", () => {
  it("compte les jours de a vers b", () => {
    expect(daysBetween("2026-08-11", "2026-08-14")).toBe(3);
    expect(daysBetween("2026-08-14", "2026-08-11")).toBe(-3);
    expect(daysBetween("2026-08-11", "2026-08-11")).toBe(0);
  });

  it("reste entier malgré un changement d'heure dans l'intervalle", () => {
    expect(daysBetween("2026-03-01", "2026-04-01")).toBe(31);
    expect(daysBetween("2026-10-01", "2026-11-01")).toBe(31);
  });

  it("est cohérent avec addDays sur une longue période", () => {
    expect(daysBetween("2026-01-01", addDays("2026-01-01", 400))).toBe(400);
  });
});

describe("isWeekend", () => {
  it("reconnaît samedi et dimanche", () => {
    expect(isWeekend("2026-08-29")).toBe(true); // samedi
    expect(isWeekend("2026-08-30")).toBe(true); // dimanche
  });

  it("rejette les jours de semaine", () => {
    expect(isWeekend("2026-08-28")).toBe(false); // vendredi
    expect(isWeekend("2026-08-31")).toBe(false); // lundi
  });
});

describe("nowTimeHHMM", () => {
  it("formate l'heure locale sur deux chiffres", () => {
    freezeLocalDate(2026, 8, 31, 9);
    expect(nowTimeHHMM()).toBe("09:00");
  });
});

describe("formatDayMonth", () => {
  it("formate en JJ/MM", () => {
    expect(formatDayMonth("2026-08-11")).toBe("11/08");
    expect(formatDayMonth("2026-01-05")).toBe("05/01");
  });
});

describe("relativeDayLabel", () => {
  it("nomme aujourd'hui et hier", () => {
    freezeLocalDate(2026, 8, 31);
    expect(relativeDayLabel("2026-08-31")).toBe("Aujourd'hui");
    expect(relativeDayLabel("2026-08-30")).toBe("Hier");
  });

  it("affiche la date pour les autres jours", () => {
    freezeLocalDate(2026, 8, 31);
    expect(relativeDayLabel("2026-08-11")).toBe("11 août");
  });

  // Un parsing UTC ferait basculer d'un jour dans les fuseaux en retard sur UTC.
  it("ne décale pas la date d'un jour", () => {
    freezeLocalDate(2026, 8, 31);
    expect(relativeDayLabel("2026-08-01")).toBe("1 août");
  });
});

describe("formatDurationLabel", () => {
  it("affiche les jours seuls sur une courte échéance", () => {
    expect(formatDurationLabel("2026-08-01", "2026-08-02")).toBe("1 jour");
    expect(formatDurationLabel("2026-08-01", "2026-08-11")).toBe("10 jours");
  });

  it("affiche mois et jours en dessous de 5 mois", () => {
    expect(formatDurationLabel("2026-01-01", "2026-03-11")).toBe("2 mois 10 jours");
  });

  it("laisse tomber les jours au-delà de 5 mois", () => {
    expect(formatDurationLabel("2026-01-01", "2026-07-15")).toBe("6 mois");
    expect(formatDurationLabel("2026-01-01", "2027-07-15")).toBe("1 an 6 mois");
  });

  it("ne garde que les années au-delà de 2 ans", () => {
    expect(formatDurationLabel("2026-01-01", "2029-07-15")).toBe("3 ans");
  });

  it("affiche 0 jour quand les deux dates sont identiques", () => {
    expect(formatDurationLabel("2026-08-11", "2026-08-11")).toBe("0 jour");
  });

  it("emprunte sur le mois précédent sans jamais produire de jours négatifs", () => {
    // Du 31 au 1er, l'emprunt se fait sur un mois plus court que le mois de
    // départ : le reliquat de jours est borné à 0 et seul le mois s'affiche.
    expect(formatDurationLabel("2026-01-31", "2026-03-01")).toBe("1 mois");
    expect(formatDurationLabel("2026-03-31", "2026-05-01")).toBe("1 mois");
    expect(formatDurationLabel("2026-01-31", "2026-02-01")).toBe("1 jour");
  });
});
