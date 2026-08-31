import { useState } from "react";
import { Card } from "../../components/Card";
import { BottomSheet } from "../../components/BottomSheet";
import { addWeightEntry, deleteWeightEntry } from "../../db/weightRepo";
import { isPeriodTrackingEnabled } from "./periodTrackingPref";
import { formatKg, formatKgValue, formatSignedKg } from "./weightFormat";
import { parseISODate } from "../../utils/date";
import type { WeightSeriesPoint } from "../../domain/weightSeries";
import "./DayDetailCard.css";

interface DayDetailCardProps {
  point: WeightSeriesPoint;
  onClose: () => void;
  /** Appelé après correction ou suppression de la pesée, pour recharger la page. */
  onChanged: () => Promise<unknown> | void;
}

/** Fiche détail d'un jour, affichée en fiche du bas au tap sur le graphique. */
export function DayDetailCard({ point, onClose, onChanged }: DayDetailCardProps) {
  const diff =
    point.weightKg !== null && point.goalWeightKg !== null ? Math.round((point.weightKg - point.goalWeightKg) * 10) / 10 : null;

  return (
    <BottomSheet onClose={onClose} label={`Détail du ${formatFullDate(point.date)}`}>
      {(close) => (
        <Card className="card--sheet">
          <div className="sheet-header">
            <h2 className="day-detail-title">{formatFullDate(point.date)}</h2>
            <button onClick={close} aria-label="Fermer" className="close-button">
              ✕
            </button>
          </div>

          <DetailRow
            label="Poids"
            value={
              point.weightKg !== null
                ? `${formatKg(point.weightKg)}${point.isReal ? "" : " (estimé)"}`
                : "Aucune pesée"
            }
          />
          {diff !== null && (
            <DetailRow
              label="Écart vs objectif"
              value={formatSignedKg(diff)}
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
          {isPeriodTrackingEnabled() && (
            <DetailRow
              label="Cycle"
              value={point.period === null ? "Non renseigné" : point.period ? "Oui" : "Non"}
              variant={point.period ? "period" : undefined}
            />
          )}

          <WeightEditor point={point} onChanged={onChanged} onDeleted={close} />

          {/* La croix est en haut de la fiche, hors de portée du pouce sur un
              grand iPhone : ce second bouton ferme depuis la zone basse. */}
          <button onClick={close} className="day-detail-close-button">
            Fermer
          </button>
        </Card>
      )}
    </BottomSheet>
  );
}

/**
 * Correction et suppression de la pesée du jour affiché.
 *
 * Placé ici plutôt que dans une page dédiée : la fiche s'ouvre déjà d'un
 * tap sur le point du graphique, c'est-à-dire exactement au moment où on
 * repère une valeur aberrante à corriger. La suppression ferme la fiche,
 * puisque le jour qu'elle décrivait n'a plus de pesée.
 */
function WeightEditor({
  point,
  onChanged,
  onDeleted,
}: {
  point: WeightSeriesPoint;
  onChanged: () => Promise<unknown> | void;
  onDeleted: () => void;
}) {
  const [value, setValue] = useState(point.isReal && point.weightKg !== null ? formatKgValue(point.weightKg) : "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    const parsed = parseFloat(value.replace(",", "."));
    if (value.trim() === "" || isNaN(parsed) || parsed <= 0 || parsed >= 400) {
      setError("Poids invalide");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await addWeightEntry(point.date, Math.round(parsed * 10) / 10);
      setSaved(true);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (point.weightKg === null) return;

    const confirmed = window.confirm(
      `Supprimer la pesée du ${formatFullDate(point.date)} (${formatKg(point.weightKg)}) ?`
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await deleteWeightEntry(point.date);
      await onChanged();
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="day-detail-editor">
      <div className="day-detail-editor-row">
        <div className="day-detail-editor-input-wrap">
          <input
            type="text"
            inputMode="decimal"
            aria-label={`Poids du ${formatFullDate(point.date)}`}
            placeholder="Poids"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
              setSaved(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className={`day-detail-editor-input ${error ? "day-detail-editor-input--error" : ""}`}
          />
          <span className="day-detail-editor-suffix">kg</span>
        </div>
        <button onClick={handleSave} disabled={busy} className="day-detail-editor-save">
          Enregistrer
        </button>
      </div>

      {saved && <p className="form-feedback">✓ Enregistré</p>}
      {error && <p className="form-error">{error}</p>}

      {point.isReal && (
        <button onClick={handleDelete} disabled={busy} className="day-detail-editor-delete">
          Supprimer la pesée
        </button>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "success" | "alert" | "period";
}) {
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span className={`detail-row-value ${variant ? `text-${variant}` : ""}`}>{value}</span>
    </div>
  );
}

function formatFullDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
