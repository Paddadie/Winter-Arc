import { Card } from "../../components/Card";
import { BottomSheet } from "../../components/BottomSheet";
import type { WeightSeriesPoint } from "../../domain/weightSeries";
import "./DayDetailCard.css";

interface DayDetailCardProps {
  point: WeightSeriesPoint;
  onClose: () => void;
}

/** Fiche détail d'un jour, affichée en fiche du bas au tap sur le graphique. */
export function DayDetailCard({ point, onClose }: DayDetailCardProps) {
  const diff =
    point.weightKg !== null && point.goalWeightKg !== null ? Math.round((point.weightKg - point.goalWeightKg) * 10) / 10 : null;

  return (
    <BottomSheet onClose={onClose}>
      {(close) => (
        <Card className="card--sheet">
          <div className="sheet-header">
            <p className="day-detail-title">{formatFullDate(point.date)}</p>
            <button onClick={close} aria-label="Fermer" className="close-button">
              ✕
            </button>
          </div>

          <DetailRow
            label="Poids"
            value={
              point.weightKg !== null
                ? `${point.weightKg.toFixed(1).replace(".", ",")} kg${point.isReal ? "" : " (estimé)"}`
                : "Aucune pesée"
            }
          />
          {diff !== null && (
            <DetailRow
              label="Écart vs objectif"
              value={`${diff > 0 ? "+" : ""}${diff.toFixed(1).replace(".", ",").replace("-0,0", "0,0")} kg`}
              variant={diff > 0 ? "alert" : "success"}
            />
          )}
          <DetailRow
            label="Sport"
            value={point.sport === null ? "Non renseigné" : point.sport ? "Oui" : "Non"}
            variant={point.sport ? "success" : undefined}
          />
          <DetailRow
            label="Écart alimentaire"
            value={point.foodDeviation === null ? "Non renseigné" : point.foodDeviation ? "Oui" : "Non"}
            variant={point.foodDeviation ? "alert" : undefined}
          />
        </Card>
      )}
    </BottomSheet>
  );
}

function DetailRow({ label, value, variant }: { label: string; value: string; variant?: "success" | "alert" }) {
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span className={`detail-row-value ${variant ? `text-${variant}` : ""}`}>{value}</span>
    </div>
  );
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}