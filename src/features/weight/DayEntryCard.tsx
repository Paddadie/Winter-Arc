import { useEffect, useState } from "react";
import { Card } from "../../components/Card";
import { CardLabel } from "../../components/CardLabel";
import { addWeightEntry } from "../../db/weightRepo";
import { getDailyLog, setDailyLog } from "../../db/dailyLogRepo";
import { todayISO } from "../../utils/date";
import { isPeriodTrackingEnabled } from "./periodTrackingPref";
import type { WeightEntry } from "../../db/schema";
import "./DayEntryCard.css";

interface DayEntryCardProps {
  entries: WeightEntry[];
  onSaved: () => void;
}

/**
 * Carte unique pour saisir/modifier les données d'un jour : poids, sport,
 * écart alimentaire. Tout est rattaché à la même date sélectionnée (par
 * défaut aujourd'hui) : changer la date recharge le poids et le journal
 * déjà connus pour ce jour-là, pour permettre de corriger facilement une
 * journée passée sans naviguer ailleurs dans l'app.
 */
export function DayEntryCard({ entries, onSaved }: DayEntryCardProps) {
  const [date, setDate] = useState(todayISO());
  const [showDateEdit, setShowDateEdit] = useState(false);

  const [weightValue, setWeightValue] = useState("");
  const [weightError, setWeightError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const [sport, setSport] = useState(false);
  const [foodDeviation, setFoodDeviation] = useState(false);
  const [period, setPeriod] = useState(false);
  const periodTrackingEnabled = isPeriodTrackingEnabled();

  // Recharge le poids (depuis les entrées déjà en mémoire) et le journal
  // (depuis la base) à chaque changement de date, pour éditer ce jour-là.
  useEffect(() => {
    const existing = entries.find((e) => e.date === date);
    setWeightValue(existing ? existing.weightKg.toFixed(1).replace(".", ",") : "");
    setWeightError(null);
    setSavedFeedback(false);

    getDailyLog(date).then((log) => {
      setSport(log?.sport ?? false);
      setFoodDeviation(log?.foodDeviation ?? false);
      setPeriod(log?.period ?? false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function handleSaveWeight() {
    const parsedWeight = parseFloat(weightValue.replace(",", "."));
    if (weightValue.trim() === "" || isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight >= 400) {
      setWeightError("Poids invalide");
      return;
    }
    setWeightError(null);
    setSaving(true);
    try {
      await addWeightEntry(date, Math.round(parsedWeight * 10) / 10);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function toggleSport() {
    const next = !sport;
    setSport(next);
    await setDailyLog(date, { sport: next });
    onSaved();
  }

  async function toggleFoodDeviation() {
    const next = !foodDeviation;
    setFoodDeviation(next);
    await setDailyLog(date, { foodDeviation: next });
    onSaved();
  }

  async function togglePeriod() {
    const next = !period;
    setPeriod(next);
    await setDailyLog(date, { period: next });
    onSaved();
  }

  return (
    <Card>
      <CardLabel className="card-label--flush">Suivi du jour</CardLabel>

      <div className="day-entry-date-row">
        {showDateEdit ? (
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="day-entry-date-input"
          />
        ) : (
          <button onClick={() => setShowDateEdit(true)} className="day-entry-date-toggle">
            {date === todayISO() ? "Aujourd'hui" : date} · modifier la date
          </button>
        )}
      </div>

      <div className="day-entry-weight-row">
        <div className="day-entry-weight-input-wrap">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Poids"
            value={weightValue}
            onChange={(e) => {
              setWeightValue(e.target.value);
              setWeightError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSaveWeight()}
            className={`day-entry-weight-input ${weightError ? "day-entry-weight-input--error" : ""}`}
          />
          <span className="day-entry-weight-suffix">kg</span>
        </div>
        <button onClick={handleSaveWeight} disabled={saving} className="day-entry-save-button">
          Enregistrer
        </button>
      </div>

      {savedFeedback && <p className="form-feedback">✓ Enregistré</p>}
      {weightError && <p className="form-error">{weightError}</p>}

      <div className="day-entry-chips-row">
        <Chip label="🏃 Sport" active={sport} variant="success" onClick={toggleSport} />
        <Chip label="🍔 Écart" active={foodDeviation} variant="alert" onClick={toggleFoodDeviation} />
        {periodTrackingEnabled && (
          <Chip label="🌸 Cycle" active={period} variant="period" onClick={togglePeriod} />
        )}
      </div>
    </Card>
  );
}

function Chip({
  label,
  active,
  variant,
  onClick,
}: {
  label: string;
  active: boolean;
  variant: "success" | "alert" | "period";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`chip chip--${variant} ${active ? "chip--active" : ""}`}
    >
      {label}
    </button>
  );
}