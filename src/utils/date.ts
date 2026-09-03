/**
 * Convertit "YYYY-MM-DD" en Date locale à minuit.
 *
 * `new Date("2026-08-11")` interpréterait la chaîne en UTC : dans un fuseau
 * en retard sur UTC, l'affichage local reculerait d'un jour. Toutes les dates
 * de l'app sont des jours civils locaux, jamais des instants — d'où ce
 * parsing explicite, à utiliser partout plutôt que `new Date(iso)`.
 */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Convertit une Date en "YYYY-MM-DD" en heure locale. */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Date du jour au format ISO "YYYY-MM-DD", en heure locale (pas UTC). */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Ajoute (ou soustrait si négatif) un nombre de jours à une date ISO. */
export function addDays(isoDate: string, days: number): string {
  const date = parseISODate(isoDate);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Nombre de jours entre deux dates ISO (b - a). */
export function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / msPerDay);
}

/**
 * Jours de [startDate, endDate] (bornes incluses) absents de `knownDates`.
 * Liste vide si la plage est vide ou entièrement couverte.
 */
export function missingDatesInRange(knownDates: string[], startDate: string, endDate: string): string[] {
  const known = new Set(knownDates);
  const missing: string[] = [];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    if (!known.has(date)) missing.push(date);
  }
  return missing;
}

/** Vrai si la date ISO tombe un samedi ou un dimanche. */
export function isWeekend(iso: string): boolean {
  const day = parseISODate(iso).getDay();
  return day === 0 || day === 6;
}

/** Heure actuelle au format "HH:MM", en heure locale. */
export function nowTimeHHMM(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** "JJ/MM" — format compact des axes et infobulles de graphique. */
export function formatDayMonth(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

/** "Aujourd'hui" / "Hier" / date longue (ex: "11 août"), pour un affichage relatif. */
export function relativeDayLabel(iso: string): string {
  const today = todayISO();
  if (iso === today) return "Aujourd'hui";
  if (iso === addDays(today, -1)) return "Hier";
  return parseISODate(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

/**
 * Durée entre deux dates ISO au format "X ans Y mois Z jours", raccourcie
 * automatiquement pour rester lisible sur les longues échéances : au-delà
 * de 5 mois, les jours ne sont plus affichés ; au-delà de 2 ans, les mois
 * non plus (ne montre alors que les années). Suppose `toIso` >= `fromIso`.
 */
export function formatDurationLabel(fromIso: string, toIso: string): string {
  const [fromYear, fromMonth, fromDay] = fromIso.split("-").map(Number);
  const [toYear, toMonth, toDay] = toIso.split("-").map(Number);

  let years = toYear - fromYear;
  let months = toMonth - fromMonth;
  let days = toDay - fromDay;

  if (days < 0) {
    months -= 1;
    days += new Date(toYear, toMonth - 1, 0).getDate(); // nombre de jours du mois précédent `toMonth`
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  // Un seul emprunt ne suffit pas toujours : du 31 janvier au 1er mars, on
  // emprunte les 28 jours de février et il reste -2. Le résultat affiché est
  // alors "1 mois", ce qui convient ; on borne surtout pour garantir qu'aucun
  // nombre de jours négatif ne puisse remonter jusqu'à l'affichage.
  days = Math.max(0, days);

  const totalMonths = years * 12 + months;
  const parts: string[] = [];

  if (totalMonths > 24) {
    parts.push(pluralize(years, "an"));
  } else if (totalMonths > 5) {
    if (years > 0) parts.push(pluralize(years, "an"));
    if (months > 0) parts.push(`${months} mois`);
  } else {
    if (months > 0) parts.push(`${months} mois`);
    if (days > 0 || parts.length === 0) parts.push(pluralize(days, "jour"));
  }

  return parts.join(" ");
}

function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count > 1 ? "s" : ""}`;
}
