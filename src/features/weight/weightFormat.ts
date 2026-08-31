/**
 * Formatage des poids, partagé par toutes les vues Régime (résumé, saisie,
 * fiche du jour, infobulles de graphique, stats d'historique) : la même
 * valeur doit s'afficher à l'identique partout — une décimale, virgule
 * décimale française.
 */

/** Valeur seule, sans unité : 83,4 */
export function formatKgValue(kg: number): string {
  return kg.toFixed(1).replace(".", ",");
}

/** Valeur avec son unité : 83,4 kg */
export function formatKg(kg: number): string {
  return `${formatKgValue(kg)} kg`;
}

/**
 * Écart de poids, toujours signé : +0,3 kg / -0,3 kg / 0,0 kg.
 * Les écarts viennent d'un `Math.round` qui peut produire -0 (ex: Math.round(-0.4)) :
 * normalisé ici, sinon l'affichage montrerait un "-0,0 kg" absurde.
 */
export function formatSignedKg(kg: number): string {
  const value = Object.is(kg, -0) ? 0 : kg;
  return `${value > 0 ? "+" : ""}${formatKg(value)}`;
}
