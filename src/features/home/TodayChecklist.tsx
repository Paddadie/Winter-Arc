import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
import { CardLabel } from "../../components/CardLabel";
import { getWeightEntriesBetween } from "../../db/weightRepo";
import { getDailyLog } from "../../db/dailyLogRepo";
import { getApneaSessionsBetween } from "../../db/apneaRepo";
import { todayISO } from "../../utils/date";
import { getHiddenTileIds } from "./tileVisibility";
import "./TodayChecklist.css";

interface ChecklistItem {
  label: string;
  done: boolean;
  route: string;
  tileId: string;
}

/**
 * Récapitulatif de ce qui reste à remplir aujourd'hui, au-dessus des tuiles.
 * Le poids et le journal (sport/écart) sont distingués bien qu'ils vivent
 * tous les deux sur la page Régime, car remplis à des moments différents
 * de la journée. "Rempli" pour le journal = un enregistrement existe pour
 * aujourd'hui, indépendamment des valeurs (même logique que les pastilles
 * du graphique de poids). Une ligne disparaît si sa tuile est masquée dans
 * les réglages (ex: Apnée si l'app est partagée avec quelqu'un qui ne
 * l'utilise pas).
 */
export function TodayChecklist() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ChecklistItem[] | null>(null);

  useEffect(() => {
    (async () => {
      const today = todayISO();
      const [weightEntries, dailyLog, apneaSessions] = await Promise.all([
        getWeightEntriesBetween(today, today),
        getDailyLog(today),
        getApneaSessionsBetween(today, today),
      ]);
      const hiddenTileIds = getHiddenTileIds();
      const allItems: ChecklistItem[] = [
        { label: "Poids", done: weightEntries.length > 0, route: "/regime", tileId: "weight" },
        { label: "Sport / Écart", done: dailyLog !== null, route: "/regime", tileId: "weight" },
        { label: "Apnée", done: apneaSessions.length > 0, route: "/apnee", tileId: "apnea" },
      ];
      setItems(allItems.filter((item) => !hiddenTileIds.has(item.tileId)));
    })();
  }, []);

  if (items === null || items.length === 0) return null;

  return (
    <Card>
      <CardLabel className="card-label--flush">Aujourd'hui</CardLabel>
      <div className="today-checklist-list">
        {items.map((item) => (
          <button key={item.label} onClick={() => navigate(item.route)} className="today-checklist-row">
            <span className={`today-checklist-status ${item.done ? "today-checklist-status--done" : ""}`}>
              {item.done ? "✓" : ""}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}