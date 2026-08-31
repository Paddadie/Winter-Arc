import { daysBetween } from "../../utils/date";
import type { FeatureReminderConfig } from "./features.config";

/**
 * Texte du rappel d'inactivité d'une tuile, ou null s'il n'y a rien à
 * signaler (fonctionnalité utilisée récemment).
 *
 * Le seuil se compte en jours écoulés depuis la dernière utilisation : à
 * `afterDays = 2`, une pesée de la veille ne déclenche rien, celle
 * d'avant-hier affiche "2 jours sans pesée".
 */
export function buildReminderLabel(
  config: FeatureReminderConfig,
  lastActivityDate: string | null,
  todayIso: string
): string | null {
  if (lastActivityDate === null) return config.neverLabel;

  const days = daysBetween(lastActivityDate, todayIso);
  if (days < config.afterDays) return null;

  return `${days} jours sans ${config.noun}`;
}
