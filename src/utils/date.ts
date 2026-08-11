/** Date du jour au format ISO "YYYY-MM-DD", en heure locale (pas UTC). */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Convertit une Date en "YYYY-MM-DD" en heure locale. */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Ajoute (ou soustrait si négatif) un nombre de jours à une date ISO. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Heure actuelle au format "HH:MM", en heure locale. */
export function nowTimeHHMM(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** "Aujourd'hui" / "Hier" / date longue (ex: "11 août"), pour un affichage relatif. */
export function relativeDayLabel(iso: string): string {
  if (iso === todayISO()) return "Aujourd'hui";
  if (iso === addDays(todayISO(), -1)) return "Hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

/** Nombre de jours entre deux dates ISO (b - a). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const dateA = new Date(ay, am - 1, ad);
  const dateB = new Date(by, bm - 1, bd);
  return Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
}
