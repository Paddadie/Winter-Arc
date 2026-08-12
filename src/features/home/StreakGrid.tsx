import { useEffect, useState } from "react";
import { Card } from "../../components/Card";
import { CardLabel } from "../../components/CardLabel";
import { getWeightEntriesBetween } from "../../db/weightRepo";
import { getApneaSessionsBetween } from "../../db/apneaRepo";
import { todayISO, addDays } from "../../utils/date";
import "./StreakGrid.css";

const DAYS = 15;

/**
 * Grille façon "contributions GitHub" : deux rangées de DAYS jours montrant
 * si le poids et l'apnée ont été renseignés ce jour-là. Sport/écart est
 * volontairement exclu (jugé moins indispensable à suivre au jour le jour).
 * "Rempli" = au moins une entrée existe ce jour-là, même logique que le
 * reste de l'app (pastilles du graphique, checklist du jour...).
 */
export function StreakGrid() {
  const [weightDates, setWeightDates] = useState<Set<string> | null>(null);
  const [apneaDates, setApneaDates] = useState<Set<string> | null>(null);

  useEffect(() => {
    (async () => {
      const start = addDays(todayISO(), -(DAYS - 1));
      const end = todayISO();
      const [weightEntries, apneaSessions] = await Promise.all([
        getWeightEntriesBetween(start, end),
        getApneaSessionsBetween(start, end),
      ]);
      setWeightDates(new Set(weightEntries.map((e) => e.date)));
      setApneaDates(new Set(apneaSessions.map((s) => s.date)));
    })();
  }, []);

  if (weightDates === null || apneaDates === null) return null;

  const days = Array.from({ length: DAYS }, (_, i) => addDays(todayISO(), -(DAYS - 1 - i)));

  return (
    <Card>
      <CardLabel className="card-label--flush">Suivi — {DAYS} derniers jours</CardLabel>

      <div className="streak-section">
        <p className="streak-label">Poids</p>
        <div className="streak-cells">
          {days.map((date) => (
            <span key={date} className={`streak-cell ${weightDates.has(date) ? "streak-cell--coral" : ""}`} />
          ))}
        </div>
      </div>

      <div className="streak-section">
        <p className="streak-label">Apnée</p>
        <div className="streak-cells">
          {days.map((date) => (
            <span key={date} className={`streak-cell ${apneaDates.has(date) ? "streak-cell--teal" : ""}`} />
          ))}
        </div>
      </div>
    </Card>
  );
}