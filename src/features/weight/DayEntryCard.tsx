import { useEffect, useState } from "react";
import { Card } from "../../components/Card";
import { addWeightEntry } from "../../db/weightRepo";
import { getDailyLog, setDailyLog } from "../../db/dailyLogRepo";
import { todayISO } from "../../utils/date";
import type { WeightEntry } from "../../db/schema";

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

  return (
    <Card>
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--color-ink-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
        }}
      >
        Suivi du jour
      </p>

      <div style={{ marginTop: "6px" }}>
        {showDateEdit ? (
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            style={{
              fontSize: "14px",
              padding: "6px 8px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
            }}
          />
        ) : (
          <button
            onClick={() => setShowDateEdit(true)}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--color-ink-muted)",
              fontSize: "13px",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            {date === todayISO() ? "Aujourd'hui" : date} · modifier la date
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "var(--space-s)", marginTop: "var(--space-m)" }}>
        <div style={{ position: "relative", flex: 1 }}>
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
            style={{
              width: "100%",
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 700,
              padding: "12px 44px 12px 16px",
              borderRadius: "var(--radius-m)",
              border: `1.5px solid ${weightError ? "var(--color-alert)" : "var(--color-border)"}`,
              color: "var(--color-ink)",
              background: "var(--color-surface)",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-ink-muted)",
              fontSize: "16px",
              fontWeight: 600,
              pointerEvents: "none",
            }}
          >
            kg
          </span>
        </div>
        <button
          onClick={handleSaveWeight}
          disabled={saving}
          style={{
            border: "none",
            borderRadius: "var(--radius-m)",
            padding: "0 var(--space-l)",
            background: "var(--color-coral)",
            color: "white",
            fontSize: "16px",
            fontWeight: 700,
            opacity: saving ? 0.6 : 1,
          }}
        >
          Enregistrer
        </button>
      </div>

      {savedFeedback && (
        <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "var(--color-success)", fontWeight: 600 }}>
          ✓ Enregistré
        </p>
      )}
      {weightError && (
        <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "var(--color-alert)" }}>{weightError}</p>
      )}

      <div style={{ display: "flex", gap: "var(--space-s)", marginTop: "var(--space-m)" }}>
        <Chip label="🏃 Sport" active={sport} color="var(--color-success)" onClick={toggleSport} />
        <Chip label="🍔 Écart" active={foodDeviation} color="var(--color-alert)" onClick={toggleFoodDeviation} />
      </div>
    </Card>
  );
}

function Chip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        border: `1.5px solid ${active ? color : "var(--color-border)"}`,
        borderRadius: "var(--radius-m)",
        padding: "10px 12px",
        background: active ? color : "var(--color-surface)",
        color: active ? "white" : "var(--color-ink)",
        fontSize: "15px",
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}