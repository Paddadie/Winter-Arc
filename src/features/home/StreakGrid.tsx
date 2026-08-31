import { useEffect, useState } from "react";
import { Card } from "../../components/Card";
import { CardLabel } from "../../components/CardLabel";
import { getWeightEntriesBetween } from "../../db/weightRepo";
import { getApneaSessionsBetween } from "../../db/apneaRepo";
import { todayISO, addDays } from "../../utils/date";
import { getHiddenTileIds } from "./tileVisibility";
import { useRefreshOnForeground } from "../../utils/useRefreshOnForeground";
import "./StreakGrid.css";

const DAYS = 15;

/**
 * Grille façon "contributions GitHub" : deux rangées de DAYS jours montrant
 * si le poids et l'apnée ont été renseignés ce jour-là. Sport/écart est
 * volontairement exclu (jugé moins indispensable à suivre au jour le jour).
 * "Rempli" = au moins une entrée existe ce jour-là, même logique que le
 * reste de l'app (pastilles du graphique, checklist du jour...). Une
 * rangée disparaît si sa tuile est masquée dans les réglages.
 */
export function StreakGrid() {
  const [weightDates, setWeightDates] = useState<Set<string> | null>(null);
  const [apneaDates, setApneaDates] = useState<Set<string> | null>(null);

  function refresh() {
    (async () => {
      const today = todayISO();
      const start = addDays(today, -(DAYS - 1));
      const [weightEntries, apneaSessions] = await Promise.all([
        getWeightEntriesBetween(start, today),
        getApneaSessionsBetween(start, today),
      ]);
      setWeightDates(new Set(weightEntries.map((e) => e.date)));
      setApneaDates(new Set(apneaSessions.map((s) => s.date)));
    })().catch(() => {
      setWeightDates(new Set());
      setApneaDates(new Set());
    });
  }

  useEffect(refresh, []);
  useRefreshOnForeground(refresh);

  if (weightDates === null || apneaDates === null) return null;

  const hiddenTileIds = getHiddenTileIds();
  const showWeight = !hiddenTileIds.has("weight");
  const showApnea = !hiddenTileIds.has("apnea");
  if (!showWeight && !showApnea) return null;

  const today = todayISO();
  const days = Array.from({ length: DAYS }, (_, i) => addDays(today, -(DAYS - 1 - i)));

  return (
    <Card>
      <CardLabel className="card-label--flush">Suivi — {DAYS} derniers jours</CardLabel>
      {showWeight && <StreakRow label="Poids" days={days} filledDates={weightDates} modifier="coral" />}
      {showApnea && <StreakRow label="Apnée" days={days} filledDates={apneaDates} modifier="teal" />}
    </Card>
  );
}

/**
 * Une rangée de la grille. Les cases n'ont pas de texte : elles sont
 * masquées aux lecteurs d'écran au profit d'un résumé chiffré sur la
 * rangée, plus utile qu'une énumération de quinze cases vides.
 */
function StreakRow({
  label,
  days,
  filledDates,
  modifier,
}: {
  label: string;
  days: string[];
  filledDates: Set<string>;
  modifier: "coral" | "teal";
}) {
  const filledCount = days.filter((date) => filledDates.has(date)).length;

  return (
    <div className="streak-section">
      <h3 className="streak-label">{label}</h3>
      <div
        className="streak-cells"
        role="img"
        aria-label={`${label} : ${filledCount} jour(s) renseigné(s) sur les ${days.length} derniers`}
      >
        {days.map((date) => (
          <span
            key={date}
            aria-hidden="true"
            className={`streak-cell ${filledDates.has(date) ? `streak-cell--${modifier}` : ""}`}
          />
        ))}
      </div>
    </div>
  );
}