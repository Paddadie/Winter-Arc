import { Card } from "../../components/Card";
import { BottomSheet } from "../../components/BottomSheet";
import type { WeightSeriesPoint } from "../../domain/weightSeries";

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
        <Card
          style={{
            borderRadius: "var(--radius-l) var(--radius-l) 0 0",
            paddingBottom: "calc(var(--space-l) + env(safe-area-inset-bottom))",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--space-s)",
            }}
          >
            <p style={{ margin: 0, fontSize: "17px", fontWeight: 700, textTransform: "capitalize" }}>
              {formatFullDate(point.date)}
            </p>
            <button
              onClick={close}
              aria-label="Fermer"
              style={{
                border: "none",
                background: "var(--color-surface)",
                color: "var(--color-ink-muted)",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                fontSize: "15px",
              }}
            >
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
              color={diff > 0 ? "var(--color-alert)" : "var(--color-success)"}
            />
          )}
          <DetailRow
            label="Sport"
            value={point.sport === null ? "Non renseigné" : point.sport ? "Oui" : "Non"}
            color={point.sport ? "var(--color-success)" : undefined}
          />
          <DetailRow
            label="Écart alimentaire"
            value={point.foodDeviation === null ? "Non renseigné" : point.foodDeviation ? "Oui" : "Non"}
            color={point.foodDeviation ? "var(--color-alert)" : undefined}
          />
        </Card>
      )}
    </BottomSheet>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <span style={{ color: "var(--color-ink-muted)", fontSize: "14px" }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: "14px", color: color ?? "var(--color-ink)" }}>{value}</span>
    </div>
  );
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}