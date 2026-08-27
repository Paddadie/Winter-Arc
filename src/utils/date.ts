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

/**
 * Durée entre deux dates ISO au format "X ans Y mois Z jours", raccourcie
 * automatiquement pour rester lisible sur les longues échéances : au-delà
 * de 5 mois, les jours ne sont plus affichés ; au-delà de 2 ans, les mois
 * non plus (ne montre alors que les années). Suppose `toIso` >= `fromIso`.
 */
export function formatDurationLabel(fromIso: string, toIso: string): string {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);

  let years = ty - fy;
  let months = tm - fm;
  let days = td - fd;

  if (days < 0) {
    months -= 1;
    days += new Date(ty, tm - 1, 0).getDate(); // nombre de jours du mois précédent `tm`
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;
  const parts: string[] = [];

  if (totalMonths > 24) {
    parts.push(`${years} an${years > 1 ? "s" : ""}`);
  } else if (totalMonths > 5) {
    if (years > 0) parts.push(`${years} an${years > 1 ? "s" : ""}`);
    if (months > 0) parts.push(`${months} mois`);
  } else {
    if (months > 0) parts.push(`${months} mois`);
    if (days > 0 || parts.length === 0) parts.push(`${days} jour${days > 1 ? "s" : ""}`);
  }

  return parts.join(" ");
}

/** Vrai si la date ISO tombe un samedi ou un dimanche. */
export function isWeekend(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 || day === 6;
}

/** Nombre de jours entre deux dates ISO (b - a). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const dateA = new Date(ay, am - 1, ad);
  const dateB = new Date(by, bm - 1, bd);
  return Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
}
